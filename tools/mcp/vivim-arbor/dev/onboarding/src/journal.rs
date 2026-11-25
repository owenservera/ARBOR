//! Dev-only durable onboarding journal. The Host must supply an owner-private directory.
//! This is a local crash-recovery contract, not a cryptographic audit trail or effect authority.
use super::*;
use std::{fs::{self,File,OpenOptions},io::{self,Read,Seek,SeekFrom,Write},path::{Path,PathBuf}};
const MAX_BYTES: u64 = 1024 * 1024;
const MAX_EVENTS: usize = 4096;
#[derive(Debug)]
pub enum JournalError { Io(io::Error), InvalidPath, Busy, Malformed, ForeignBinding, Full, Poisoned, Transition(Error) }
impl From<io::Error> for JournalError { fn from(e:io::Error)->Self{Self::Io(e)} }
impl From<Error> for JournalError { fn from(e:Error)->Self{Self::Transition(e)} }
#[derive(Clone)]
enum Event { Enable, Skip, Claim(String), Observe(Observation), NotApplied(Claim), Revoke }
impl Event {
    fn apply(&self,s:&mut Setup)->Result<(),Error>{
        match self {
            Self::Enable=>s.enable(),Self::Skip=>s.skip(),
            Self::Claim(op)=>s.claim(op.clone()).map(|_|()),
            Self::Observe(o)=>s.observe(o.clone()),
            Self::NotApplied(c)=>s.confirm_not_applied(c),
            Self::Revoke=>{if s.status()==Status::Revoked{return Err(Error::InvalidState)}s.revoke();Ok(())}
        }
    }
    fn encode(&self)->String{
        match self {
            Self::Enable=>"enable".into(), Self::Skip=>"skip".into(),
            Self::Claim(op)=>format!("claim\t{op}"),
            Self::Observe(o)=>format!("observe\t{}\t{}",o.claim.operation,match o.outcome {
                Outcome::Verified=>"verified",Outcome::NeedsUserAuthorization=>"authorization",
                Outcome::Unavailable=>"unavailable",Outcome::Unknown=>"unknown"
            }),
            Self::NotApplied(c)=>format!("not-applied\t{}",c.operation),
            Self::Revoke=>"revoke".into()
        }
    }
    fn decode(parts:&[&str],s:&Setup)->Result<Self,JournalError>{
        let claim=|op:&str|s.pending().filter(|c|c.operation==op).cloned().ok_or(JournalError::Malformed);
        Ok(match parts {
            ["enable"]=>Self::Enable, ["skip"]=>Self::Skip, ["claim",op]=>Self::Claim((*op).into()),
            ["observe",op,result]=>{let c=claim(op)?;let outcome=match *result {
                "verified"=>Outcome::Verified,"authorization"=>Outcome::NeedsUserAuthorization,
                "unavailable"=>Outcome::Unavailable,"unknown"=>Outcome::Unknown,_=>return Err(JournalError::Malformed)
            }; Self::Observe(Observation{kind:c.step.evidence(),claim:c,outcome})},
            ["not-applied",op]=>Self::NotApplied(claim(op)?),["revoke"]=>Self::Revoke,
            _=>return Err(JournalError::Malformed)
        })
    }
}
fn header(b:&Binding)->String{format!("vivim-onboarding-dev/1\t{}\t{}\t{}\t{}\n",b.development_instance,b.device,b.account,b.workspace)}
fn path_for(root:&Path,b:&Binding)->Result<PathBuf,JournalError>{
    if !b.valid() || !fs::symlink_metadata(root)?.file_type().is_dir(){return Err(JournalError::InvalidPath)}
    let actual=fs::canonicalize(root)?;
    if actual.file_name().and_then(|x|x.to_str())!=Some(b.development_instance.as_str()){
        return Err(JournalError::InvalidPath)
    }
    Ok(actual.join("onboarding.journal"))
}
/// The caller is the single local Host owner. Hold the OS lock for the journal lifetime.
/// Drop releases the lock even after process termination; an incomplete record fails closed.
pub struct Journal {
    file:File, setup:Setup, sequence:usize, bytes:u64, poisoned:bool, reopened:bool,
}
impl Journal {
    pub fn create(root:&Path,binding:Binding)->Result<Self,JournalError>{
        let setup=Setup::new(binding.clone())?;
        let path=path_for(root,&binding)?;
        let mut file=OpenOptions::new().read(true).write(true).create_new(true).open(path)?;
        file.try_lock().map_err(|_|JournalError::Busy)?;
        let h=header(&binding);
        file.write_all(h.as_bytes())?;file.sync_all()?;
        Ok(Self{file,setup,sequence:0,bytes:h.len() as u64,poisoned:false,reopened:false})
    }
    pub fn open(root:&Path,binding:Binding)->Result<Self,JournalError>{
        let mut setup=Setup::new(binding.clone())?;
        let path=path_for(root,&binding)?;
        if !fs::symlink_metadata(&path)?.file_type().is_file(){return Err(JournalError::InvalidPath)}
        let mut file=OpenOptions::new().read(true).write(true).open(&path)?;
        file.try_lock().map_err(|_|JournalError::Busy)?;
        if file.metadata()?.len()>MAX_BYTES{return Err(JournalError::Full)}
        let mut raw=String::new();(&mut file).take(MAX_BYTES+1).read_to_string(&mut raw)?;
        if raw.len() as u64>MAX_BYTES{return Err(JournalError::Full)}
        if !raw.ends_with('\n'){return Err(JournalError::Malformed)}
        let mut lines=raw.split_terminator('\n');
        if lines.next()!=Some(header(&binding).trim_end_matches('\n')){return Err(JournalError::ForeignBinding)}
        let mut sequence=0;
        for line in lines {
            sequence+=1;if sequence>MAX_EVENTS{return Err(JournalError::Full)}
            let parts:Vec<_>=line.split('\t').collect();
            if parts.first().and_then(|x|x.parse::<usize>().ok())!=Some(sequence){return Err(JournalError::Malformed)}
            Event::decode(&parts[1..],&setup)?.apply(&mut setup).map_err(|_|JournalError::Malformed)?;
        }
        let mut j=Self{file,setup,sequence,bytes:raw.len() as u64,poisoned:false,reopened:true};
        // Claim may have been dispatched before the crash; never emit it a second time.
        if j.setup.status()==Status::InProgress {
            if let Some(c)=j.setup.pending().cloned(){
                j.record(Event::Observe(Observation{kind:c.step.evidence(),claim:c,outcome:Outcome::Unknown}))?;
            }
        }
        Ok(j)
    }
    pub fn state(&self)->&Setup{&self.setup}
    pub fn sequence(&self)->usize{self.sequence}
    /// A saved Ready record is historical evidence only. The Host must re-check runtime,
    /// remote session and phone before presenting current readiness.
    pub fn requires_live_revalidation(&self)->bool{self.reopened&&self.setup.status()==Status::Ready}
    fn record(&mut self,event:Event)->Result<(),JournalError>{
        if self.poisoned{return Err(JournalError::Poisoned)}
        let mut candidate=self.setup.clone();event.apply(&mut candidate)?;
        let line=format!("{}\t{}\n",self.sequence+1,event.encode());
        if self.sequence>=MAX_EVENTS||self.bytes+line.len() as u64>MAX_BYTES{return Err(JournalError::Full)}
        let result=(||->io::Result<()>{
            self.file.seek(SeekFrom::End(0))?;
            if self.file.stream_position()?!=self.bytes{return Err(io::Error::new(io::ErrorKind::InvalidData,"journal length changed"))}
            self.file.write_all(line.as_bytes())?;self.file.sync_all()
        })();
        if let Err(e)=result{self.poisoned=true;return Err(JournalError::Io(e))}
        self.setup=candidate;self.sequence+=1;self.bytes+=line.len() as u64;Ok(())
    }
    pub fn enable(&mut self)->Result<(),JournalError>{self.record(Event::Enable)}
    pub fn skip(&mut self)->Result<(),JournalError>{self.record(Event::Skip)}
    /// A successful return is the durable pre-effect claim; only then may Host dispatch once.
    pub fn claim(&mut self,operation:String)->Result<Claim,JournalError>{
        self.record(Event::Claim(operation))?;
        Ok(self.setup.pending().expect("validated claim").clone())
    }
    pub fn observe(&mut self,o:Observation)->Result<(),JournalError>{self.record(Event::Observe(o))}
    pub fn confirm_not_applied(&mut self,c:&Claim)->Result<(),JournalError>{self.record(Event::NotApplied(c.clone()))}
    /// Caller must first close actual local admission and reconcile in-flight effects.
    pub fn revoke(&mut self)->Result<(),JournalError>{self.record(Event::Revoke)}
}
#[cfg(test)]
mod tests{
    use super::*;
    use std::sync::atomic::{AtomicUsize,Ordering};
    static NEXT:AtomicUsize=AtomicUsize::new(0);
    struct Fixture{root:PathBuf,b:Binding}
    impl Fixture{fn new()->Self{let name=format!("dev-journal-{}-{}",std::process::id(),NEXT.fetch_add(1,Ordering::Relaxed));
        let root=std::env::temp_dir().join(&name);fs::create_dir(&root).unwrap();
        let b=Binding{development_instance:name,device:"device".into(),account:"account".into(),workspace:"workspace".into()};Self{root,b}}
        fn create(&self)->Journal{Journal::create(&self.root,self.b.clone()).unwrap()}
        fn open(&self)->Journal{Journal::open(&self.root,self.b.clone()).unwrap()}
    }
    impl Drop for Fixture{fn drop(&mut self){let _=fs::remove_dir_all(&self.root);}}
    fn op(n:usize)->String{format!("{n:032x}")}
    fn verify(j:&mut Journal,c:Claim){j.observe(Observation{kind:c.step.evidence(),claim:c,outcome:Outcome::Verified}).unwrap()}
    #[test]fn reopen_skipped(){let f=Fixture::new();{let mut j=f.create();j.skip().unwrap();}let mut j=f.open();assert_eq!(j.state().status(),Status::Skipped);j.enable().unwrap();assert_eq!(j.state().next_step(),Some(Step::Entitlement));}
    #[test]fn crash_after_claim_reconciles(){let f=Fixture::new();let c;{let mut j=f.create();j.enable().unwrap();c=j.claim(op(1)).unwrap();}let mut j=f.open();assert_eq!(j.state().status(),Status::Reconcile);assert_eq!(j.sequence(),3);assert!(j.claim(op(2)).is_err());verify(&mut j,c);assert_eq!(j.state().next_step(),Some(Step::ProvisionPrivateTunnel));}
    #[test]fn crash_after_observation_does_not_replay(){let f=Fixture::new();{let mut j=f.create();j.enable().unwrap();let c=j.claim(op(1)).unwrap();verify(&mut j,c);}let mut j=f.open();assert_eq!(j.state().next_step(),Some(Step::ProvisionPrivateTunnel));assert!(matches!(j.claim(op(1)),Err(JournalError::Transition(Error::ReusedOperation))));}
    #[test]fn second_writer_refused(){let f=Fixture::new();let _j=f.create();assert!(matches!(Journal::open(&f.root,f.b.clone()),Err(JournalError::Busy)));}
    #[test]fn foreign_binding_refused(){let f=Fixture::new();drop(f.create());let mut b=f.b.clone();b.account="foreign".into();assert!(matches!(Journal::open(&f.root,b),Err(JournalError::ForeignBinding)));}
    #[test]fn truncated_tail_refused(){let f=Fixture::new();drop(f.create());let mut file=OpenOptions::new().append(true).open(f.root.join("onboarding.journal")).unwrap();file.write_all(b"1\tcla").unwrap();drop(file);assert!(matches!(Journal::open(&f.root,f.b.clone()),Err(JournalError::Malformed)));}
    #[test]fn invalid_sequence_refused(){let f=Fixture::new();drop(f.create());let mut file=OpenOptions::new().append(true).open(f.root.join("onboarding.journal")).unwrap();file.write_all(b"2\tenable\n").unwrap();drop(file);assert!(matches!(Journal::open(&f.root,f.b.clone()),Err(JournalError::Malformed)));}
    #[test]fn reopen_ready_requires_revalidation(){let f=Fixture::new();{let mut j=f.create();j.enable().unwrap();for i in 1..=12{let c=j.claim(op(i)).unwrap();verify(&mut j,c)}assert!(!j.requires_live_revalidation());}let j=f.open();assert_eq!(j.state().status(),Status::Ready);assert!(j.requires_live_revalidation());}
    #[test]fn revoke_persists(){let f=Fixture::new();{let mut j=f.create();j.enable().unwrap();j.claim(op(1)).unwrap();j.revoke().unwrap()}let j=f.open();assert_eq!(j.state().status(),Status::Revoked);assert!(j.state().pending().is_none());}
}

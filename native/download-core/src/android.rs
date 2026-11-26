//! JNI binding for the existing VIVIM Android owner service.
//! No Android UI, grants, Intent routing or file chooser are owned here.
use crate::{Command, Manager, SCHEMA};
use jni::{JNIEnv, objects::{JClass, JString}, sys::jstring};
use serde_json::{Value,json};
use std::{path::Path, sync::{Arc,Mutex,OnceLock}, panic::{catch_unwind,AssertUnwindSafe}};
use tokio::runtime::Runtime;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();
static ENGINE: Mutex<Option<Arc<Manager>>> = Mutex::new(None);
fn runtime() -> &'static Runtime {
    RUNTIME.get_or_init(||Runtime::new().expect("Android download runtime"))
}
fn response(result: anyhow::Result<Value>) -> Value {
    match result {
        Ok(v)=>json!({"schema":SCHEMA,"ok":true,"result":v}),
        Err(_)=>json!({"schema":SCHEMA,"ok":false,"error":"DOWNLOAD_OPERATION_FAILED"}),
    }
}
fn call(env: &mut JNIEnv, arg: JString, f: impl FnOnce(String)->anyhow::Result<Value>) -> jstring {
    let result=catch_unwind(AssertUnwindSafe(||{
        let arg:String=env.get_string(&arg)?.into();
        Ok(response(f(arg)))
    })).ok().and_then(|r: anyhow::Result<Value>|r.ok())
      .unwrap_or_else(||response(Err(anyhow::anyhow!("JNI error"))));
    env.new_string(result.to_string()).map(|s|s.into_raw()).unwrap_or(std::ptr::null_mut())
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_live_vivim_surfaceprobe_DownloadService_nativeOpen(mut env: JNIEnv, _: JClass, root:JString)->jstring {
    call(&mut env,root,|root|{
        let path=Path::new(&root);
        anyhow::ensure!(path.is_absolute(),"absolute app root required");
        let mut guard=ENGINE.lock().map_err(|_|anyhow::anyhow!("lock"))?;
        if guard.is_none(){*guard=Some(Arc::new(runtime().block_on(Manager::open(path,false))?));}
        Ok(guard.as_ref().unwrap().list())
    })
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_live_vivim_surfaceprobe_DownloadService_nativeDispatch(mut env: JNIEnv, _: JClass, command:JString)->jstring {
    call(&mut env,command,|command|{
        let command:Command=serde_json::from_str(&command)?;
        let engine=ENGINE.lock().map_err(|_|anyhow::anyhow!("lock"))?.clone()
            .ok_or_else(||anyhow::anyhow!("engine not active"))?;
        runtime().block_on(engine.execute(command))
    })
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_live_vivim_surfaceprobe_DownloadService_nativeInterrupt(_:JNIEnv,_:JClass) {
    let _=catch_unwind(||{
        if let Ok(guard)=ENGINE.try_lock(){if let Some(e)=guard.as_ref(){e.cancel();}}
    });
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_live_vivim_surfaceprobe_DownloadService_nativeClose(_:JNIEnv,_:JClass) {
    let _=catch_unwind(||{
        let engine=ENGINE.lock().ok().and_then(|mut g|g.take());
        if let Some(engine)=engine{engine.cancel();runtime().block_on(engine.stop());}
    });
}

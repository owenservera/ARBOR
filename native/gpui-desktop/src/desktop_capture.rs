//! Explicit, owner-initiated Windows GPUI window capture.
//!
//! Not an always-on recorder or a phone capture. No Chrome, Edge, WebView,
//! Desktop Commander, external process, clipboard scraping, or background
//! surveillance is required. Output stays local under LOCALAPPDATA/VIVIM.
//! Only the user-selected Developer menu command invokes capture.
use std::{
    env, fs::{self, File, OpenOptions}, io::{self,BufWriter},
    path::PathBuf, time::{SystemTime,UNIX_EPOCH}
};

fn local_dir(category:&str)->io::Result<PathBuf>{
    let base=env::var_os("LOCALAPPDATA").filter(|value|!value.is_empty())
        .ok_or_else(||io::Error::new(io::ErrorKind::NotFound,"LOCALAPPDATA_UNAVAILABLE"))?;
    Ok(PathBuf::from(base).join("VIVIM").join(category))
}
pub fn screenshot_dir()->io::Result<PathBuf>{local_dir("Screenshots")}
pub fn diagnostics_dir()->io::Result<PathBuf>{local_dir("Diagnostics")}
fn unique_stamp()->io::Result<String>{
    let timestamp=SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(io::Error::other)?.as_millis();
    Ok(format!("{timestamp}-{}",std::process::id()))
}
fn new_file(dir:PathBuf,prefix:&str,extension:&str)->io::Result<(PathBuf,File)> {
    fs::create_dir_all(&dir)?;
    let file=dir.join(format!("{prefix}-{}.{}",unique_stamp()?,extension));
    let opened=OpenOptions::new().write(true).create_new(true).open(&file)?;
    Ok((file,opened))
}
pub fn save_diagnostics(summary:&str)->io::Result<PathBuf>{
    if summary.len()>32_768 {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,"DIAGNOSTICS_TOO_LONG"));
    }
    let (file,mut stream)=new_file(diagnostics_dir()?,"vivim-gpui-diagnostics","txt")?;
    use std::io::Write;
    stream.write_all(summary.as_bytes())?;
    stream.sync_all()?;
    Ok(file)
}

/// Native, metadata-only directory inspection. Borrow the useful bounded
/// filesystem-observation behavior from Desktop Commander, not its MCP server.
/// Only an explicitly chosen VIVIM-owned directory is passed by the caller.
/// No path names, file contents, symlink traversal, or user-home enumeration.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DirectoryObservation {
    pub regular_files: u32,
    pub total_bytes: u64,
    pub truncated: bool,
}
/// Public read is fixed to the application's own screenshot directory:
/// callers cannot use this observer to enumerate arbitrary host paths.
pub fn inspect_screenshot_directory() -> io::Result<DirectoryObservation> {
    inspect_owned_directory(&screenshot_dir()?)
}
#[cfg(windows)]
fn is_windows_reparse(meta: &fs::Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;
    meta.file_attributes() & 0x400 != 0
}
#[cfg(not(windows))]
fn is_windows_reparse(_: &fs::Metadata) -> bool { false }

fn inspect_owned_directory(dir: &std::path::Path) -> io::Result<DirectoryObservation> {
    const MAX_ENTRIES: usize = 256;
    let meta = fs::symlink_metadata(dir)?;
    if meta.file_type().is_symlink() || !meta.is_dir() || is_windows_reparse(&meta) {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "INSPECTION_ROOT_NOT_DIRECTORY"));
    }
    let mut result = DirectoryObservation { regular_files: 0, total_bytes: 0, truncated: false };
    for (index, item) in fs::read_dir(dir)?.enumerate() {
        if index >= MAX_ENTRIES { result.truncated = true; break; }
        let item = item?;
        let kind = fs::symlink_metadata(item.path())?;
        // Inspect only direct, regular entries; never traverse links or folders.
        if !kind.is_file() || kind.file_type().is_symlink() || is_windows_reparse(&kind) { continue; }
        result.regular_files += 1;
        result.total_bytes = result.total_bytes.saturating_add(kind.len());
    }
    Ok(result)
}

#[cfg(windows)]
pub fn capture_window_png()->io::Result<PathBuf>{
    let (width,height,rgba)=win::capture_own_window()?;
    let (path,file)=new_file(screenshot_dir()?,"vivim-gpui-window","png")?;
    let result=(||->io::Result<()> {
        let mut encoder=png::Encoder::new(BufWriter::new(file),width,height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer=encoder.write_header().map_err(io::Error::other)?;
        writer.write_image_data(&rgba).map_err(io::Error::other)?;
        writer.finish().map_err(io::Error::other)
    })();
    if let Err(error)=result {
        let _=fs::remove_file(&path);
        return Err(error);
    }
    Ok(path)
}
#[cfg(not(windows))]
pub fn capture_window_png()->io::Result<PathBuf>{
    Err(io::Error::new(io::ErrorKind::Unsupported,"WINDOWS_ONLY"))
}
#[cfg(windows)]
mod win {
    use std::{ffi::c_void,io,mem};
    type Handle=*mut c_void;
    #[repr(C)] #[derive(Default)]
    struct Rect { left:i32,top:i32,right:i32,bottom:i32 }
    #[repr(C)] #[derive(Default)]
    struct BitmapInfoHeader {
        size:u32,width:i32,height:i32,planes:u16,bit_count:u16,
        compression:u32,size_image:u32,x_pels:i32,y_pels:i32,clr_used:u32,clr_important:u32
    }
    #[repr(C)] #[derive(Default)]
    struct BitmapInfo {header:BitmapInfoHeader,colors:[u32;1]}
    #[link(name="user32")]
    unsafe extern "system" {
        fn EnumWindows(callback:Option<unsafe extern "system" fn(Handle,isize)->i32>,param:isize)->i32;
        fn GetWindowThreadProcessId(hwnd:Handle,pid:*mut u32)->u32;
        fn IsWindowVisible(hwnd:Handle)->i32;
        fn GetWindowRect(hwnd:Handle,rect:*mut Rect)->i32;
        fn GetForegroundWindow()->Handle;
        fn GetDC(hwnd:Handle)->Handle;
        fn ReleaseDC(hwnd:Handle,dc:Handle)->i32;
    }
    #[link(name="kernel32")]
    unsafe extern "system" {fn GetCurrentProcessId()->u32;}
    #[link(name="gdi32")]
    unsafe extern "system" {
        fn CreateCompatibleDC(dc:Handle)->Handle;
        fn CreateCompatibleBitmap(dc:Handle,width:i32,height:i32)->Handle;
        fn SelectObject(dc:Handle,object:Handle)->Handle;
        fn BitBlt(dest:Handle,x:i32,y:i32,w:i32,h:i32,source:Handle,sx:i32,sy:i32,rop:u32)->i32;
        fn GetDIBits(dc:Handle,bitmap:Handle,start:u32,lines:u32,bits:*mut c_void,
            info:*mut BitmapInfo,usage:u32)->i32;
        fn DeleteObject(object:Handle)->i32;
        fn DeleteDC(dc:Handle)->i32;
    }
    unsafe extern "system" fn locate(hwnd:Handle,param:isize)->i32 {
        let mut pid=0;
        // SAFETY: callback receives Windows-owned HWND and our valid pointer.
        unsafe {
            GetWindowThreadProcessId(hwnd,&mut pid);
            if pid!=GetCurrentProcessId() || IsWindowVisible(hwnd)==0 {return 1;}
            let mut rect=Rect::default();
            if GetWindowRect(hwnd,&mut rect)==0 || rect.right-rect.left<320 ||
                rect.bottom-rect.top<240 {return 1;}
            *(param as *mut Handle)=hwnd;
        }
        0
    }
    struct OwnedDc{src:Handle,mem:Handle,bitmap:Handle,old:Handle}
    impl Drop for OwnedDc {
        fn drop(&mut self){
            // SAFETY: each resource belongs exclusively to this capture.
            unsafe {
                if !self.old.is_null(){SelectObject(self.mem,self.old);}
                if !self.bitmap.is_null(){DeleteObject(self.bitmap);}
                if !self.mem.is_null(){DeleteDC(self.mem);}
                if !self.src.is_null(){ReleaseDC(std::ptr::null_mut(),self.src);}
            }
        }
    }
    pub fn capture_own_window()->io::Result<(u32,u32,Vec<u8>)>{
        // SAFETY: FFI calls capture only the verified foreground bounds of
        // our own window. Unfocused/occluded app capture is denied.
        unsafe {
            let mut hwnd:Handle=std::ptr::null_mut();
            EnumWindows(Some(locate),(&mut hwnd as *mut Handle) as isize);
            if hwnd.is_null(){return Err(io::Error::new(io::ErrorKind::NotFound,"GPUI_WINDOW_NOT_FOUND"));}
            let mut rect=Rect::default();
            if GetWindowRect(hwnd,&mut rect)==0 {
                return Err(io::Error::last_os_error());
            }
            let width=rect.right-rect.left;
            let height=rect.bottom-rect.top;
            if !(320..=4096).contains(&width) || !(240..=4096).contains(&height) {
                return Err(io::Error::new(io::ErrorKind::InvalidData,"GPUI_WINDOW_DIMENSIONS"));
            }
            // A GPUI GPU-backed window often returns an entirely black bitmap
            // from GetWindowDC. Capture the composited screen instead, but
            // ONLY when our own window is foreground; otherwise fail closed
            // to avoid capturing unrelated desktop/user content.
            if GetForegroundWindow()!=hwnd {
                return Err(io::Error::new(io::ErrorKind::PermissionDenied,
                    "FOREGROUND_GPUI_REQUIRED"));
            }
            let src=GetDC(std::ptr::null_mut());
            if src.is_null(){return Err(io::Error::last_os_error())}
            let mut owned=OwnedDc{src,mem:std::ptr::null_mut(),
                bitmap:std::ptr::null_mut(),old:std::ptr::null_mut()};
            owned.mem=CreateCompatibleDC(src);
            if owned.mem.is_null(){return Err(io::Error::last_os_error())}
            owned.bitmap=CreateCompatibleBitmap(src,width,height);
            if owned.bitmap.is_null(){return Err(io::Error::last_os_error())}
            owned.old=SelectObject(owned.mem,owned.bitmap);
            if owned.old.is_null(){return Err(io::Error::last_os_error())}
            const SRCCOPY:u32=0x00CC0020;
            if BitBlt(owned.mem,0,0,width,height,src,rect.left,rect.top,SRCCOPY)==0 {
                return Err(io::Error::last_os_error());
            }
            // The bitmap must be deselected before GetDIBits.
            SelectObject(owned.mem,owned.old);
            owned.old=std::ptr::null_mut();
            let mut bitmap_info=BitmapInfo::default();
            bitmap_info.header=BitmapInfoHeader {
                size:mem::size_of::<BitmapInfoHeader>() as u32,
                width,height:-height,planes:1,bit_count:32,
                compression:0,size_image:0,x_pels:0,y_pels:0,clr_used:0,clr_important:0
            };
            let pixel_count=(width as usize).checked_mul(height as usize)
                .and_then(|n|n.checked_mul(4))
                .ok_or_else(||io::Error::new(io::ErrorKind::InvalidData,"IMAGE_TOO_LARGE"))?;
            let mut rgba=vec![0u8;pixel_count];
            let rows=GetDIBits(owned.mem,owned.bitmap,0,height as u32,
                rgba.as_mut_ptr().cast(),&mut bitmap_info,0);
            if rows!=height {return Err(io::Error::last_os_error())}
            // The empty First Contact screen has non-black composer chrome;
            // refuse a blank GPU capture rather than writing a misleading PNG.
            if rgba.chunks_exact(4).all(|p|p[0]==0 && p[1]==0 && p[2]==0) {
                return Err(io::Error::new(io::ErrorKind::InvalidData,
                    "EMPTY_OR_UNAVAILABLE_GPU_CAPTURE"));
            }
            // Windows 32-bit BI_RGB bytes are BGRA. PNG expects RGBA.
            for pixel in rgba.chunks_exact_mut(4) {
                pixel.swap(0,2);
                pixel[3]=255;
            }
            Ok((width as u32,height as u32,rgba))
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn output_paths_are_only_local_appdata(){
        let old=env::var_os("LOCALAPPDATA");
        // Avoid mutating global environment in concurrent Rust tests.
        if let Some(value)=old {
            let root=PathBuf::from(value).join("VIVIM");
            assert!(screenshot_dir().unwrap().starts_with(&root));
            assert!(diagnostics_dir().unwrap().starts_with(&root));
        }
    }
    #[test]
    fn bounded_inspection_is_metadata_only_and_rejects_files() {
        let base=std::env::temp_dir().join(format!("vivim-inspect-{}",std::process::id()));
        let _=fs::remove_dir_all(&base);
        fs::create_dir(&base).unwrap();
        let file=base.join("private-name-not-reported.txt");
        fs::write(&file,b"secret").unwrap();
        let observation=inspect_owned_directory(&base).unwrap();
        assert_eq!(observation,DirectoryObservation{
            regular_files:1,total_bytes:6,truncated:false
        });
        assert!(inspect_owned_directory(&file).is_err());
        fs::remove_dir_all(&base).unwrap();
    }
    #[test]
    fn report_has_explicit_bounded_content(){
        assert!(save_diagnostics(&"x".repeat(32_769)).is_err());
    }
}

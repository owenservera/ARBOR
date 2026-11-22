//! Native Win32 application menu shell for GPUI 0.2.2 on Windows.
//!
//! GPUI 0.2.2 stores set_menus() in Windows platform state but does not mount
//! a Win32 HMENU. This thin adapter adds one real HMENU to *our own* HWND.
//! WM_COMMAND is marshalled as small stable IDs, never invokes GPUI from a
//! foreign callback, and is dispatched later on the GPUI UI thread. The menu
//! shares the exact desktop_menu catalog with the existing app actions.
//!
//! This adapter is Windows-only. Other platforms can retain a drawn fallback.
use crate::desktop_menu::{self,Intent,Section};

pub const FIRST_ID: u16 = 0x4000;
pub const SECTION_STRIDE: u16 = 64;

/// GPUI 0.2.2 creates a DirectComposition HWND with
/// WS_EX_NOREDIRECTIONBITMAP. User32 still reports a valid HMENU and menu
/// rectangles, but the nonclient menu strip is transparent on the actual
/// Windows compositor. Keep the top-edge GPUI application menu by default.
/// Experimental native plumbing remains opt-in for isolated diagnostics.
pub fn experimental_opt_in() -> bool {
    #[cfg(windows)]
    {
        std::env::var_os("VIVIM_EXPERIMENTAL_WIN32_MENU").as_deref()
            == Some(std::ffi::OsStr::new("1"))
    }
    #[cfg(not(windows))]
    { false }
}

pub fn id_for(section:Section,index:usize)->Option<u16> {
    if index>=SECTION_STRIDE as usize || index>=desktop_menu::entries(section).len(){
        return None;
    }
    let section_index=Section::ALL.iter().position(|&value|value==section)?;
    FIRST_ID.checked_add((section_index as u16)*SECTION_STRIDE + index as u16)
}
pub fn intent_for(id:u16)->Option<Intent> {
    let offset=id.checked_sub(FIRST_ID)?;
    let section=Section::ALL.get((offset/SECTION_STRIDE) as usize)?;
    desktop_menu::entries(*section)
        .get((offset%SECTION_STRIDE) as usize)
        .map(|entry|entry.intent)
}
#[cfg(windows)]
mod win {
    use super::*;
    use std::{collections::VecDeque,ffi::c_void,iter,ptr,mem,
        sync::{Mutex,atomic::{AtomicIsize,Ordering}}};
    type Handle=*mut c_void;
    type Wparam=usize;
    type Lparam=isize;
    type Lresult=isize;
    const MF_POPUP:u32=0x10;
    const MF_STRING:u32=0x00;
    const WM_COMMAND:u32=0x0111;
    const WM_NCDESTROY:u32=0x0082;
    const GWLP_WNDPROC:i32=-4;
    const SWP_NOSIZE:u32=0x0001;
    const SWP_NOMOVE:u32=0x0002;
    const SWP_NOZORDER:u32=0x0004;
    const SWP_NOACTIVATE:u32=0x0010;
    const SWP_FRAMECHANGED:u32=0x0020;
    static HWND:AtomicIsize=AtomicIsize::new(0);
    static OLD_PROC:AtomicIsize=AtomicIsize::new(0);
    static COMMANDS:Mutex<VecDeque<u16>>=Mutex::new(VecDeque::new());
    #[repr(C)] #[derive(Default)]
    struct Rect {left:i32,top:i32,right:i32,bottom:i32}
    #[link(name="user32")]
    unsafe extern "system" {
        fn EnumWindows(callback:Option<unsafe extern "system" fn(Handle,isize)->i32>,param:isize)->i32;
        fn GetWindowThreadProcessId(hwnd:Handle,pid:*mut u32)->u32;
        fn GetWindowRect(hwnd:Handle,rect:*mut Rect)->i32;
        fn CreateMenu()->Handle;
        fn CreatePopupMenu()->Handle;
        fn AppendMenuW(menu:Handle, flags:u32, id:usize, label:*const u16)->i32;
        fn SetMenu(hwnd:Handle,menu:Handle)->i32;
        fn GetMenu(hwnd:Handle)->Handle;
        fn DrawMenuBar(hwnd:Handle)->i32;
        fn GetMenuItemRect(hwnd:Handle,menu:Handle,item:u32,rect:*mut Rect)->i32;
        fn SetWindowPos(hwnd:Handle,insert_after:Handle,x:i32,y:i32,w:i32,h:i32,flags:u32)->i32;
        fn DestroyMenu(menu:Handle)->i32;
        fn SetWindowLongPtrW(hwnd:Handle,index:i32,value:isize)->isize;
        fn CallWindowProcW(old:Option<unsafe extern "system" fn(Handle,u32,Wparam,Lparam)->Lresult>,
            hwnd:Handle,message:u32,wparam:Wparam,lparam:Lparam)->Lresult;
    }
    #[link(name="kernel32")]
    unsafe extern "system" {fn GetCurrentProcessId()->u32;}
    unsafe extern "system" fn find_owned_window(hwnd:Handle,param:isize)->i32 {
        // SAFETY: Windows passes a valid HWND; param points to our local HWND
        // output for the duration of EnumWindows.
        unsafe {
            let mut pid=0u32;
            GetWindowThreadProcessId(hwnd,&mut pid);
            if pid!=GetCurrentProcessId() {return 1;}
            let mut bounds=Rect::default();
            if GetWindowRect(hwnd,&mut bounds)==0 ||
                bounds.right-bounds.left<320 || bounds.bottom-bounds.top<240 {return 1;}
            let output=param as *mut Handle;
            *output=hwnd;
        }
        0
    }
    unsafe extern "system" fn menu_wndproc(hwnd:Handle,msg:u32,wparam:Wparam,lparam:Lparam)->Lresult {
        if msg==WM_COMMAND && lparam==0 {
            let id=(wparam & 0xffff) as u16;
            if intent_for(id).is_some() {
                // Never execute Host effects, block on I/O, or call GPUI in
                // this Win32 callback. Queue only bounded known commands.
                if let Ok(mut q)=COMMANDS.try_lock() {
                    if q.len()<32 {q.push_back(id);}
                }
                return 0;
            }
        }
        let prev=OLD_PROC.load(Ordering::Acquire);
        let previous=if prev==0 {None}else{
            // SAFETY: SetWindowLongPtrW provided a valid prior window proc.
            Some(unsafe {mem::transmute::<isize,unsafe extern "system" fn(Handle,u32,Wparam,Lparam)->Lresult>(prev)})
        };
        // SAFETY: forward all messages to GPUI's original Windows proc.
        let result=unsafe{CallWindowProcW(previous,hwnd,msg,wparam,lparam)};
        if msg==WM_NCDESTROY {
            HWND.store(0,Ordering::Release);
            OLD_PROC.store(0,Ordering::Release);
            if let Ok(mut q)=COMMANDS.try_lock(){q.clear();}
        }
        result
    }
    fn wide(label:&str)->Vec<u16> {label.encode_utf16().chain(iter::once(0)).collect()}
    pub fn installed()->bool {HWND.load(Ordering::Acquire)!=0}
    /// An installed HMENU does not prove its chrome is actually visible.
    /// Keep the app-shell fallback until Windows exposes native geometry.
    pub fn visually_ready()->bool {
        let raw=HWND.load(Ordering::Acquire);
        if raw==0 {return false;}
        // An OS-supplied rectangle can exist even when GPUI's GPU window
        // compositor fails to paint that region. The owner-visible GPUI
        // app shell is the safe default. Native visual cutover requires an
        // explicit opt-in for experimental Windows menu acceptance; ordinary
        // startup must not silently hide the only accessible menu.
        if !experimental_opt_in(){return false;}
        // SAFETY: read-only Win32 geometry probe for the owned window.
        unsafe {
            let hwnd=raw as Handle;
            let menu=GetMenu(hwnd);
            if menu.is_null(){return false;}
            let mut rect=Rect::default();
            GetMenuItemRect(hwnd,menu,0,&mut rect)!=0 &&
                rect.right>rect.left+4 && rect.bottom>rect.top+4
        }
    }
    pub fn install()->Result<bool,String> {
        if installed(){return Ok(true)}
        let mut hwnd:Handle=ptr::null_mut();
        // SAFETY: synchronous enumeration of windows in this process.
        unsafe {EnumWindows(Some(find_owned_window),(&mut hwnd as *mut Handle) as isize);}
        if hwnd.is_null(){return Ok(false)}
        // Never override any existing native Windows menu.
        if !unsafe{GetMenu(hwnd)}.is_null(){
            return Err("Existing Windows native menu present; refusing to replace".into());
        }
        // SAFETY: all handles are checked before use; on failure we destroy
        // the standalone HMENU. After SetMenu, Windows owns that HMENU.
        unsafe {
            let root=CreateMenu();
            if root.is_null(){return Err("CreateMenu failed".into())}
            let build=(||->Result<(),String>{
                for section in Section::ALL {
                    let popup=CreatePopupMenu();
                    if popup.is_null(){return Err("CreatePopupMenu failed".into())}
                    // After successful AppendMenuW MF_POPUP, root owns popup.
                    let header=wide(section.label());
                    if AppendMenuW(root,MF_POPUP,popup as usize,header.as_ptr())==0 {
                        DestroyMenu(popup);
                        return Err(format!("Appending {} submenu failed",section.label()));
                    }
                    for (index,item) in desktop_menu::entries(section).iter().enumerate(){
                        let id=id_for(section,index)
                            .ok_or_else(||"Invalid fixed native menu ID".to_owned())?;
                        let label=wide(item.label);
                        if AppendMenuW(popup,MF_STRING,id as usize,label.as_ptr())==0 {
                            return Err(format!("Appending {} item failed",item.key));
                        }
                    }
                }
                if SetMenu(hwnd,root)==0 {
                    return Err("SetMenu failed".into());
                }
                // Subclass after the HMENU is mounted, before any UI command.
                let old=SetWindowLongPtrW(hwnd,GWLP_WNDPROC,menu_wndproc as *const () as isize);
                if old==0 {
                    SetMenu(hwnd,ptr::null_mut());
                    return Err("WndProc subclass failed".into());
                }
                OLD_PROC.store(old,Ordering::Release);
                HWND.store(hwnd as isize,Ordering::Release);
                // Recalculate the nonclient frame after HMENU attachment
                // without changing bounds, activation or z-order.
                SetWindowPos(hwnd,ptr::null_mut(),0,0,0,0,
                    SWP_NOMOVE|SWP_NOSIZE|SWP_NOZORDER|
                    SWP_NOACTIVATE|SWP_FRAMECHANGED);
                DrawMenuBar(hwnd);
                Ok(())
            })();
            if let Err(e)=build {
                DestroyMenu(root);
                return Err(e);
            }
        }
        Ok(true)
    }
    pub fn take_command()->Option<Intent>{
        let id=COMMANDS.lock().ok()?.pop_front()?;
        intent_for(id)
    }
}
#[cfg(windows)]
pub fn install()->Result<bool,String> {win::install()}
#[cfg(windows)]
pub fn installed()->bool {win::installed()}
#[cfg(windows)]
pub fn visually_ready()->bool {win::visually_ready()}
#[cfg(windows)]
pub fn take_command()->Option<Intent> {win::take_command()}
#[cfg(not(windows))]
pub fn install()->Result<bool,String> {Ok(false)}
#[cfg(not(windows))]
pub fn installed()->bool {false}
#[cfg(not(windows))]
pub fn visually_ready()->bool {false}
#[cfg(not(windows))]
pub fn take_command()->Option<Intent> {None}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn native_menu_ids_are_unique_and_round_trip(){
        let mut seen=std::collections::HashSet::new();
        for section in Section::ALL {
            for (i,item) in desktop_menu::entries(section).iter().enumerate(){
                let id=id_for(section,i).expect("known catalog item");
                assert!(seen.insert(id));
                assert_eq!(intent_for(id),Some(item.intent));
            }
        }
        assert_eq!(intent_for(FIRST_ID-1),None);
        assert_eq!(intent_for(FIRST_ID+1000),None);
    }
}

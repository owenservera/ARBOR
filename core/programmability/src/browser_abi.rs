//! Minimal wasm32 ABI for the exact shared product kernel; no JS glue
//! generator or browser-specific fork of VLANG/VEC domain code.
//! @hq:capability vivim.rust-product-browser-abi@1
//! All allocations are owned and released in WASM linear memory.
use crate::product_kernel::{dispatch_json,MAX_WIRE_BYTES,refuse};
use std::{mem,ptr,slice,str};

#[no_mangle]
pub extern "C" fn vivim_kernel_alloc(len:u32)->u32{
    if len==0||len as usize>MAX_WIRE_BYTES{return 0}
    let mut boxed=vec![0u8;len as usize].into_boxed_slice();
    let address=boxed.as_mut_ptr() as u32;
    mem::forget(boxed);
    address
}
#[no_mangle]
pub unsafe extern "C" fn vivim_kernel_free(address:u32,len:u32){
    if address==0||len==0||len as usize>MAX_WIRE_BYTES{return}
    let parts=ptr::slice_from_raw_parts_mut(address as *mut u8,len as usize);
    drop(Box::from_raw(parts));
}
#[no_mangle]
pub unsafe extern "C" fn vivim_kernel_dispatch(address:u32,len:u32)->u64{
    if address==0||len==0||len as usize>MAX_WIRE_BYTES{return 0}
    // Caller allocates and owns the input in this module's linear memory.
    let bytes=slice::from_raw_parts(address as *const u8,len as usize);
    let response=match str::from_utf8(bytes){
        Ok(request)=>dispatch_json(request),
        Err(_)=>refuse("","INVALID_JSON").to_string()
    };
    let mut boxed=response.into_bytes().into_boxed_slice();
    let output_len=boxed.len();
    if output_len==0||output_len>MAX_WIRE_BYTES{return 0}
    let pointer=boxed.as_mut_ptr() as u32;
    mem::forget(boxed);
    ((output_len as u64)<<32)|(pointer as u64)
}

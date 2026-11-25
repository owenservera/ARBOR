#![cfg(feature="rust-syntax")]
use hqkg::rust_syntax::extract;
use serde_json::Value;
fn item<'a>(v:&'a Value, name:&str)->&'a Value {
    v["items"].as_array().unwrap().iter().find(|r|r["qualifiedName"]==name).unwrap()
}
#[test]
fn actual_hqkg_source_has_syntax_backed_symbols() {
    let v=extract(include_str!("../src/semantic_source.rs")).unwrap();
    let source=item(&v,"sources");
    assert_eq!(source["kind"],"function");
    assert_eq!(source["exported"],true);
    assert_eq!(source["signatureDigest"].as_str().unwrap().len(),64);
    assert_eq!(source["docs"].as_array().unwrap().len(),0,"file header is not item ownership");
}
#[test]
fn lexical_ownership_rejects_string_and_explicit_doc_attribute() {
    let text = r###"//! @hq:capability module-only@1
pub mod a {
    /// @hq:capability demo.run@1
    pub fn run() { let _ = r#"/// @hq:capability forged@1"#; }
}
pub mod b {
    #[doc = " @hq:capability manufactured@1"]
    pub fn run() {}
}
"###;
    let v=extract(text).unwrap();
    assert_eq!(item(&v,"a::run")["docs"][0]["line"],3);
    assert_eq!(item(&v,"b::run")["docs"].as_array().unwrap().len(),0);
    assert_eq!(item(&v,"a")["docs"].as_array().unwrap().len(),0);
    assert_eq!(v["items"].as_array().unwrap().len(),4);
}
#[test]
fn stable_token_fingerprints_and_line_spans() {
    let a=extract("/// @hq:capability test@1\npub fn run(x: u32)->u32 {x+1}\n").unwrap();
    let b=extract("\r\n/// @hq:capability test@1\r\npub fn run(x: u32)->u32 { x + 2 }\r\n").unwrap();
    let c=extract("\n/// @hq:capability test@1\npub fn run(x: u32)->u32 { x + 1 }\n").unwrap();
    assert_ne!(a["sourceDigest"],b["sourceDigest"]);
    assert_eq!(item(&a,"run")["signatureDigest"],item(&b,"run")["signatureDigest"]);
    assert_ne!(item(&a,"run")["syntaxDigest"],item(&b,"run")["syntaxDigest"]);
    assert_eq!(item(&a,"run")["syntaxDigest"],item(&c,"run")["syntaxDigest"]);
    assert_eq!(item(&b,"run")["docs"][0]["line"],2);
}
#[test]
fn impl_and_trait_ownership_are_distinct() {
    let v=extract("struct A; struct B; trait T { fn run(); } impl A { fn run() {} } impl B { fn run() {} }").unwrap();
    let methods:Vec<_>=v["items"].as_array().unwrap().iter().filter(|i|i["name"]=="run").collect();
    assert_eq!(methods.len(),3);
    assert_ne!(methods[1]["qualifiedName"],methods[2]["qualifiedName"]);
    assert_eq!(item(&v,"T::run")["kind"],"trait-method");
}
#[test]
fn invalid_syntax_never_returns_partial_success() {
    assert!(extract("fn broken( {").is_err());
    assert!(extract(&" ".repeat(hqkg::rust_syntax::MAX_SOURCE_BYTES+1)).is_err());
}

#[test]
fn callable_declaration_fingerprint_includes_visibility_and_cfg_not_body_or_doc() {
    let a=extract("/// first doc\npub fn run(x:u32)->u32 {x+1}\n").unwrap();
    let b=extract("/// replacement doc\npub fn run(x:u32)->u32 {x+2}\n").unwrap();
    let c=extract("pub(crate) fn run(x:u32)->u32 {x+1}\n").unwrap();
    let d=extract("#[cfg(target_os=\"windows\")]\npub fn run(x:u32)->u32 {x+1}\n").unwrap();
    let e=extract("pub fn run(x:u64)->u64 {x+1}\n").unwrap();
    let signature=|v:&serde_json::Value| item(v,"run")["signatureDigest"].as_str().unwrap().to_owned();
    assert_eq!(signature(&a),signature(&b));
    assert_ne!(item(&a,"run")["syntaxDigest"],item(&b,"run")["syntaxDigest"]);
    assert_ne!(signature(&a),signature(&c));
    assert_ne!(signature(&a),signature(&d));
    assert_ne!(signature(&a),signature(&e));
}
#[test]
fn static_and_constant_declaration_fingerprints_include_type_and_mutability() {
    let a=extract("pub static X:u32=1; pub const Y:u32=1;").unwrap();
    let b=extract("pub static mut X:u32=2; pub const Y:u32=2;").unwrap();
    let c=extract("pub static X:u64=1; pub const Y:u64=1;").unwrap();
    assert_ne!(item(&a,"X")["signatureDigest"],item(&b,"X")["signatureDigest"]);
    assert_eq!(item(&a,"Y")["signatureDigest"],item(&b,"Y")["signatureDigest"]);
    assert_ne!(item(&a,"Y")["signatureDigest"],item(&c,"Y")["signatureDigest"]);
}

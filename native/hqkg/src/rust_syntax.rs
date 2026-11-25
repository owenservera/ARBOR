//! Rust AST extraction for the existing HQ index; no registry writes or effects.
//! @hq:capability hqkg.rust-syntax@1
//! Syntactic ownership, not name resolution, macro expansion, or rustc type checking.
use crate::{Error, Result};
use proc_macro2::Span;
use quote::ToTokens;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use syn::{spanned::Spanned, AttrStyle, Attribute, Expr, Item, Lit, Meta, Visibility};

pub const MAX_SOURCE_BYTES: usize = 1_500_000;
const MAX_ITEMS: usize = 8192;
const MAX_DEPTH: usize = 64;
const MAX_NAME: usize = 512;

fn digest(bytes: impl AsRef<[u8]>) -> String {
    format!("{:x}", Sha256::digest(bytes.as_ref()))
}
fn token_digest(tokens: &impl ToTokens) -> String {
    digest(tokens.to_token_stream().to_string())
}
fn qualified(prefix: &str, name: &str) -> String {
    if prefix.is_empty() { name.to_owned() } else { format!("{prefix}::{name}") }
}
fn public(vis: &Visibility) -> bool { matches!(vis, Visibility::Public(_)) }
struct Extractor<'a> {
    lines: Vec<&'a str>,
    items: Vec<Value>,
}
impl Extractor<'_> {
    // Only actual outer line-doc comments are bound. Explicit #[doc], block
    // docs, inner module docs and macro tokens do not become item annotations.
    fn docs(&self, attrs: &[Attribute]) -> Vec<Value> {
        attrs.iter().filter_map(|a| {
            if !matches!(a.style, AttrStyle::Outer) || !a.path().is_ident("doc") {
                return None;
            }
            let Meta::NameValue(nv) = &a.meta else { return None };
            let Expr::Lit(expr) = &nv.value else { return None };
            let Lit::Str(lit) = &expr.lit else { return None };
            let line = a.span().start().line;
            let raw = self.lines.get(line.checked_sub(1)?)?.trim_start();
            let doc = raw.strip_prefix("///")?;
            if doc.starts_with('/') || doc.trim() != lit.value().trim() { return None; }
            // Do not export arbitrary documentation/source text. Only a
            // candidate tag line; HQ owns admission of the versioned grammar.
            if !doc.contains("@hq:") { return None; }
            Some(json!({"line":line,"comment":doc}))
        }).collect()
    }
    fn push(&mut self, prefix: &str, name: &str, kind: &str, ident: Span,
        item: &impl ToTokens, item_span: Span, signature: &impl ToTokens,
        attrs: &[Attribute], exported: bool) -> Result<String> {
        let q = qualified(prefix, name);
        if q.len() > MAX_NAME || self.items.len() >= MAX_ITEMS {
            return Err(Error::Invalid("Rust syntax extraction item/name bound exceeded".into()));
        }
        let start = ident.start().line;
        let end = item_span.end().line;
        if start == 0 || end < start || end > self.lines.len() {
            return Err(Error::Corrupt("Rust syntax span outside source".into()));
        }
        self.items.push(json!({
            "qualifiedName":q,"name":name,"kind":kind,"line":start,"endLine":end,
            "exported":exported,"syntaxDigest":token_digest(item),
            "signatureDigest":token_digest(signature),"docs":self.docs(attrs)
        }));
        Ok(q)
    }
    fn walk(&mut self, items: &[Item], prefix: &str, depth: usize) -> Result<()> {
        if depth > MAX_DEPTH { return Err(Error::Invalid("Rust syntax module depth exceeded".into())); }
        for item in items {
            match item {
                Item::Fn(x) => { self.push(prefix,&x.sig.ident.to_string(),"function",x.sig.ident.span(),
                    x,x.span(),&x.sig,&x.attrs,public(&x.vis))?; }
                Item::Struct(x) => { self.push(prefix,&x.ident.to_string(),"struct",x.ident.span(),
                    x,x.span(),x,&x.attrs,public(&x.vis))?; }
                Item::Enum(x) => { self.push(prefix,&x.ident.to_string(),"enum",x.ident.span(),
                    x,x.span(),x,&x.attrs,public(&x.vis))?; }
                Item::Union(x) => { self.push(prefix,&x.ident.to_string(),"union",x.ident.span(),
                    x,x.span(),x,&x.attrs,public(&x.vis))?; }
                Item::Type(x) => { self.push(prefix,&x.ident.to_string(),"type",x.ident.span(),
                    x,x.span(),x,&x.attrs,public(&x.vis))?; }
                Item::Const(x) => { self.push(prefix,&x.ident.to_string(),"constant",x.ident.span(),
                    x,x.span(),&x.ty,&x.attrs,public(&x.vis))?; }
                Item::Static(x) => { self.push(prefix,&x.ident.to_string(),"static",x.ident.span(),
                    x,x.span(),&x.ty,&x.attrs,public(&x.vis))?; }
                Item::Mod(x) => {
                    let q=self.push(prefix,&x.ident.to_string(),"module",x.ident.span(),
                        x,x.span(),&x.ident,&x.attrs,public(&x.vis))?;
                    if let Some((_,inner))=&x.content { self.walk(inner,&q,depth+1)?; }
                }
                Item::Trait(x) => {
                    let q=self.push(prefix,&x.ident.to_string(),"trait",x.ident.span(),
                        x,x.span(),x,&x.attrs,public(&x.vis))?;
                    for member in &x.items {
                        if let syn::TraitItem::Fn(f)=member {
                            self.push(&q,&f.sig.ident.to_string(),"trait-method",f.sig.ident.span(),
                                f,f.span(),&f.sig,&f.attrs,false)?;
                        }
                    }
                }
                Item::Impl(x) => {
                    // Lexical impl identity: type + optional trait + generics.
                    // This does not claim two differently spelled types resolve alike.
                    let key = format!("{}|{}|{}",x.self_ty.to_token_stream(),
                        x.trait_.as_ref().map(|(_,p,_)|p.to_token_stream().to_string()).unwrap_or_default(),
                        x.generics.to_token_stream());
                    let scope=qualified(prefix,&format!("impl_{}",digest(key)));
                    for member in &x.items {
                        if let syn::ImplItem::Fn(f)=member {
                            self.push(&scope,&f.sig.ident.to_string(),"method",f.sig.ident.span(),
                                f,f.span(),&f.sig,&f.attrs,public(&f.vis))?;
                        }
                    }
                }
                _ => {} // no invented symbols from macro expansion or local statements
            }
        }
        Ok(())
    }
}
/// Parse already-authorized bytes from HQ; no filesystem discovery or execution.
pub fn extract(source: &str) -> Result<Value> {
    if source.len() > MAX_SOURCE_BYTES {
        return Err(Error::Invalid("Rust syntax source exceeds byte bound".into()));
    }
    let parsed = syn::parse_file(source)
        .map_err(|e| Error::Invalid(format!("Rust syntax parse failed: {e}")))?;
    let mut extraction=Extractor{lines:source.lines().collect(),items:Vec::new()};
    extraction.walk(&parsed.items,"",0)?;
    Ok(json!({"schema":"hqkg.rust-syntax/1","sourceDigest":digest(source),
        "assurance":"syntax-only","items":extraction.items}))
}

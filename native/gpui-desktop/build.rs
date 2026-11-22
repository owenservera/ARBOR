// Native Windows GPUI's render/event stack can exceed MSVC's default 1 MiB
// when mounting the canonical product alongside app-owned menu capabilities.
// Preserve a single main-thread GPUI application; do not create a second UI
// thread/window as a workaround. Explicitly reserve 8 MiB for the Windows GUI.
// This is a linker property, not runtime allocation or an effect authority.
fn main() {
    #[cfg(target_os = "windows")]
    println!("cargo:rustc-link-arg-bin=vivim-gpui-desktop=/STACK:8388608");
}

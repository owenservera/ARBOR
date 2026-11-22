//! Native source inventory for the ONE local VIVIM window.
//! Legacy HTML is retained only as migration input; this registry grants no
//! network, browser, approval, provider send, window launch or state authority.
//! A "port-needed" row is NOT an accepted GPUI implementation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Placement { File, Edit, View, Tools, Developer, Settings, Help }
impl Placement {
    pub const fn label(self) -> &'static str {
        match self {
            Self::File=>"File",Self::Edit=>"Edit",Self::View=>"View",
            Self::Tools=>"Tools",Self::Developer=>"Developer",
            Self::Settings=>"Settings",Self::Help=>"Help",
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Disposition { NativeShell, CanonicalPwa, LegacyUi, RetiredShell, Reference }
impl Disposition {
    pub const fn label(self)->&'static str {
        match self {
            Self::NativeShell=>"only local UI",
            Self::CanonicalPwa=>"shared product canvas",
            Self::LegacyUi=>"native parity pending; do not relaunch",
            Self::RetiredShell=>"retired launcher",
            Self::Reference=>"non-production reference"
        }
    }
}
#[derive(Clone, Copy, Debug)]
pub struct Surface {
    pub id: &'static str,
    pub source: &'static str,
    pub placement: Placement,
    pub disposition: Disposition,
}
pub const SURFACES:&[Surface]=&[
    Surface{id:"gpui-native",source:"native/gpui-desktop/src/main.rs",placement:Placement::File,disposition:Disposition::NativeShell},
    Surface{id:"phone-canonical",source:"apps/mobile-relay/index.html",placement:Placement::View,disposition:Disposition::CanonicalPwa},
    Surface{id:"grokbot",source:"apps/mobile-relay/grokbot.html",placement:Placement::Developer,disposition:Disposition::Reference},
    Surface{id:"host-control",source:"apps/vivim-host/public/index.html",placement:Placement::Tools,disposition:Disposition::LegacyUi},
    Surface{id:"host-first-run",source:"apps/vivim-host/public/mobile-first.html",placement:Placement::View,disposition:Disposition::LegacyUi},
    Surface{id:"host-onboarding",source:"apps/vivim-host/public/onboarding.html",placement:Placement::Settings,disposition:Disposition::LegacyUi},
    Surface{id:"host-chat",source:"apps/vivim-host/public/pages/chat.html",placement:Placement::View,disposition:Disposition::LegacyUi},
    Surface{id:"host-wiki",source:"apps/vivim-host/public/pages/wiki.html",placement:Placement::View,disposition:Disposition::LegacyUi},
    Surface{id:"host-demo-shell",source:"demo/host-legacy/demo-shell.html",placement:Placement::Developer,disposition:Disposition::Reference},
    Surface{id:"host-demo",source:"demo/host-legacy/demo.html",placement:Placement::Developer,disposition:Disposition::Reference},
    Surface{id:"tierflow-mission-control",source:"packages/tierflow/web/index.html",placement:Placement::Developer,disposition:Disposition::LegacyUi},
    Surface{id:"studio-architecture",source:"studio/architecture/atlas.html",placement:Placement::Developer,disposition:Disposition::Reference},
    Surface{id:"studio-capture",source:"studio/src/studio/ui/index.html",placement:Placement::Tools,disposition:Disposition::LegacyUi},
    Surface{id:"studio-chat",source:"studio/src/studio/ui/chat.html",placement:Placement::View,disposition:Disposition::LegacyUi},
    Surface{id:"studio-craft",source:"studio/src/studio/ui/craft-intel.html",placement:Placement::Developer,disposition:Disposition::LegacyUi},
    Surface{id:"studio-drive",source:"studio/src/studio/ui/drive.html",placement:Placement::File,disposition:Disposition::LegacyUi},
    Surface{id:"studio-live",source:"studio/src/studio/ui/live.html",placement:Placement::Developer,disposition:Disposition::LegacyUi},
    Surface{id:"studio-mobile",source:"studio/src/studio/ui/mobile.html",placement:Placement::View,disposition:Disposition::LegacyUi},
    Surface{id:"studio-personal-agent",source:"studio/src/studio/ui/personal-agent.html",placement:Placement::Tools,disposition:Disposition::LegacyUi},
    Surface{id:"studio-platform",source:"studio/src/studio/ui/platform.html",placement:Placement::Developer,disposition:Disposition::LegacyUi},
    Surface{id:"wiki-browse",source:"wiki/index.html",placement:Placement::Developer,disposition:Disposition::Reference},
    Surface{id:"tauri-webview-shell",source:"src-tauri/src/main.rs",placement:Placement::Developer,disposition:Disposition::RetiredShell},
];
// Read-only donor inventory: duplicates and research pages are not another
// VIVIM UI runtime. No donor repository is mutated by this projection.
#[derive(Clone, Copy, Debug)]
pub struct DonorSurface {
    pub repo: &'static str,
    pub source: &'static str,
    pub target_menu: Placement,
}
pub const DONOR_SURFACES:&[DonorSurface]=&[
    DonorSurface{repo:"vivim-labs",source:"adaptors-providers/ui/index.html",target_menu:Placement::Tools},
    DonorSurface{repo:"vivim-labs",source:"capability-observatory/lane-d/dashboard.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-web-harness",source:"apps/browser-companion/options.html",target_menu:Placement::Settings},
    DonorSurface{repo:"vivim-web-harness",source:"apps/mobile-relay/grokbot.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-web-harness",source:"apps/mobile-relay/index.html",target_menu:Placement::View},
    DonorSurface{repo:"vivim-web-harness",source:"apps/share-web/index.html",target_menu:Placement::View},
    DonorSurface{repo:"vivim-web-harness",source:"apps/vivim-host/public/index.html",target_menu:Placement::Tools},
    DonorSurface{repo:"vivim-web-harness",source:"apps/vivim-host/public/onboarding.html",target_menu:Placement::Settings},
    DonorSurface{repo:"vivim-web-harness",source:"studio/architecture/atlas.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-web-harness",source:"studio/marketing/index.html",target_menu:Placement::Help},
    DonorSurface{repo:"vivim-web-harness",source:"studio/marketing/product.html",target_menu:Placement::Help},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/chat.html",target_menu:Placement::View},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/drive.html",target_menu:Placement::File},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/index.html",target_menu:Placement::Tools},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/live.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/mobile.html",target_menu:Placement::View},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/personal-agent.html",target_menu:Placement::Tools},
    DonorSurface{repo:"vivim-web-harness",source:"studio/src/studio/ui/platform.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-ui",source:"web/index.html",target_menu:Placement::Developer},
    DonorSurface{repo:"vivim-ui",source:"wiki/index.html",target_menu:Placement::Developer},
    DonorSurface{repo:"craft-anything",source:"apps/craft-anything-web/index.html",target_menu:Placement::Developer},
    DonorSurface{repo:"craft-anything",source:"vendor/wgpu-hal/examples/raw-gles.em.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/canvas-check/hq-canvas.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/canvas-v2/hq-canvas.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/dashboard/DASHBOARD-PREVIEW.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/dashboard/shots/harness.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/dashboard/shots/interact.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/dashboard/shots/measure.html",target_menu:Placement::Developer},
    DonorSurface{repo:"repos_hq",source:".work/pm-check/hq-pm.html",target_menu:Placement::Developer},
];
pub const PRODUCT_TABS:[&str;7]=["Today","Talk","Build","World","Wiki","Me","Control"];
pub const NATIVE_MENU_SECTIONS:[&str;7]=["File","Edit","View","Tools","Developer","Settings","Help"];
pub fn group_count(placement:Placement)->usize {
    SURFACES.iter().filter(|surface|surface.placement==placement).count()
}
pub fn disposition_count(disposition:Disposition)->usize {
    SURFACES.iter().filter(|surface|surface.disposition==disposition).count()
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;
    #[test]
    fn one_desktop_window_and_one_shared_product_entry() {
        assert_eq!(disposition_count(Disposition::NativeShell),1);
        assert_eq!(disposition_count(Disposition::CanonicalPwa),1);
        assert_eq!(PRODUCT_TABS.len(),7);
        assert_eq!(NATIVE_MENU_SECTIONS.len(),7);
    }
    #[test]
    fn all_identified_ui_sources_have_one_menu_owner_or_shared_canvas() {
        let mut paths=BTreeSet::new();
        let mut ids=BTreeSet::new();
        for surface in SURFACES {
            assert!(paths.insert(surface.source), "duplicate source {}",surface.source);
            assert!(ids.insert(surface.id), "duplicate surface {}",surface.id);
            assert!(!surface.source.contains(".."));
            if surface.disposition==Disposition::CanonicalPwa {
                assert_eq!(surface.source,"apps/mobile-relay/index.html");
                assert_eq!(surface.placement,Placement::View);
            }
            if surface.disposition==Disposition::NativeShell {
                assert_eq!(surface.source,"native/gpui-desktop/src/main.rs");
            }
        }
        assert_eq!(SURFACES.iter().filter(|r|r.source.ends_with(".html")).count(),20);
        assert!(disposition_count(Disposition::LegacyUi)>10);
    }
    #[test]
    fn every_repository_html_surface_is_accounted_for() {
        use std::{fs,path::Path};
        // Development-time source closure only. Customers do not need Git
        // or the historical HTML tree to run the compiled VIVIM executable.
        let root=Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let registered=SURFACES.iter()
            .filter(|row|row.source.ends_with(".html"))
            .map(|row|row.source).collect::<BTreeSet<_>>();
        for relative in [
            "apps/mobile-relay", "apps/vivim-host/public", "demo/host-legacy",
            "packages/tierflow/web", "studio/architecture",
            "studio/src/studio/ui", "wiki",
        ] {
            let mut pending=vec![root.join(relative)];
            while let Some(dir)=pending.pop() {
                for entry in fs::read_dir(&dir).expect("tracked HTML scope exists") {
                    let entry=entry.expect("source directory can be listed");
                    let path=entry.path();
                    if path.is_dir() {
                        if !matches!(path.file_name().and_then(|s|s.to_str()),
                            Some("node_modules"|"target"|".git"|"dist")) {
                            pending.push(path);
                        }
                    } else if path.extension().is_some_and(|ext|ext=="html") {
                        let relative=path.strip_prefix(&root)
                            .expect("HTML under repository source");
                        let relative=relative.to_string_lossy().replace('\\',"/");
                        assert!(registered.contains(relative.as_str()),
                            "unclassified UI entrypoint: {relative}");
                    }
                }
            }
        }
        for path in registered {
            assert!(root.join(path).is_file(), "inventory references missing UI: {path}");
        }
    }
    #[test]
    fn donor_ui_sources_are_read_only_and_categorized_not_launched() {
        let mut names=BTreeSet::new();
        for row in DONOR_SURFACES {
            assert!(names.insert((row.repo,row.source)));
            assert!(row.source.ends_with(".html"));
            assert!(!row.source.contains(".."));
            assert!(matches!(row.target_menu,Placement::File|Placement::View|
                Placement::Tools|Placement::Developer|Placement::Settings|Placement::Help));
        }
        assert_eq!(DONOR_SURFACES.len(),29);
        assert_eq!(SURFACES.iter().filter(|s|s.source.ends_with(".html")).count()
            + DONOR_SURFACES.len(),49);
    }
    #[test]
    fn legacy_sources_are_never_counted_as_native_accepted() {
        assert!(SURFACES.iter().filter(|row|row.disposition==Disposition::LegacyUi)
            .all(|row|row.disposition.label().contains("pending")));
        assert!(SURFACES.iter().any(|row|row.id=="studio-drive"&&row.placement==Placement::File));
        assert!(SURFACES.iter().any(|row|row.id=="host-onboarding"&&row.placement==Placement::Settings));
        assert!(SURFACES.iter().any(|row|row.id=="tierflow-mission-control"&&row.placement==Placement::Developer));
    }
}

//! Native Windows application chrome for the one canonical VIVIM surface.
//! Menus navigate existing GPUI tools and local preferences; they never own
//! a second product state, Host command authority, or browser renderer.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Section { File, Edit, View, Tools, Developer, Settings, Help }
impl Section {
    pub const ALL: [Section; 7] = [
        Self::File, Self::Edit, Self::View, Self::Tools, Self::Developer, Self::Settings, Self::Help
    ];
    pub const fn label(self) -> &'static str {
        match self {
            Self::File => "File",
            Self::Edit => "Edit",
            Self::View => "View",
            Self::Tools => "Tools",
            Self::Developer => "Developer",
            Self::Settings => "Settings",
            Self::Help => "Help",
        }
    }
    pub const fn key(self) -> &'static str {
        match self {
            Self::File => "bar-file",
            Self::Edit => "bar-edit",
            Self::View => "bar-view",
            Self::Tools => "bar-tools",
            Self::Developer => "bar-developer",
            Self::Settings => "bar-settings",
            Self::Help => "bar-help",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Destination {
    FirstContact, WikiInspector, Devices, HostStatus, Build, KnowledgeGraph,
    HostDecisions, DeveloperTools, Preferences, About
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Intent {
    Navigate(Destination),
    RefreshSources,
    FocusComposer,
    ClearComposer,
    CaptureWindow,
    OpenScreenshotsFolder,
    SaveDiagnostics,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Item {
    pub key: &'static str,
    pub label: &'static str,
    pub intent: Intent,
}
impl Item {
    pub const fn new(key: &'static str, label: &'static str, intent: Intent) -> Self {
        Self { key, label, intent }
    }
}
use Destination::*;
use Intent::*;
pub const FILE: &[Item] = &[
    Item::new("file-first-contact", "First Contact", Navigate(FirstContact)),
    Item::new("file-refresh", "Refresh sources", RefreshSources),
];
pub const EDIT: &[Item] = &[
    Item::new("edit-focus", "Focus composer", FocusComposer),
    Item::new("edit-clear", "Clear unsent draft", ClearComposer),
];
pub const VIEW: &[Item] = &[
    Item::new("view-home", "First Contact", Navigate(FirstContact)),
    Item::new("view-wiki", "Wiki inspector", Navigate(WikiInspector)),
    Item::new("view-devices", "Phone and devices", Navigate(Devices)),
];
pub const TOOLS: &[Item] = &[
    Item::new("tools-host", "Host status", Navigate(HostStatus)),
    Item::new("tools-build", "Build / VEC", Navigate(Build)),
    Item::new("tools-graph", "Knowledge graph", Navigate(KnowledgeGraph)),
    Item::new("tools-decisions", "Host decisions", Navigate(HostDecisions)),
];
pub const DEVELOPER: &[Item] = &[
    Item::new("developer-home", "Developer tools", Navigate(DeveloperTools)),
    Item::new("developer-capture", "Capture GPUI screenshot", CaptureWindow),
    Item::new("developer-open-captures", "Open screenshot folder", OpenScreenshotsFolder),
    Item::new("developer-report", "Save diagnostic report", SaveDiagnostics),
    Item::new("developer-refresh", "Refresh Host/Wiki state", RefreshSources),
    Item::new("developer-host", "Inspect Host", Navigate(HostStatus)),
    Item::new("developer-wiki", "Inspect Wiki", Navigate(WikiInspector)),
    Item::new("developer-vec", "Inspect visual compiler", Navigate(Build)),
    Item::new("developer-graph", "Inspect knowledge graph", Navigate(KnowledgeGraph)),
    Item::new("developer-phone", "Inspect phone state", Navigate(Devices)),
];
pub const SETTINGS: &[Item] = &[
    Item::new("settings-preferences", "Preferences…", Navigate(Preferences)),
];
pub const HELP: &[Item] = &[
    Item::new("help-about", "About VIVIM", Navigate(About)),
];
pub const fn entries(section: Section) -> &'static [Item] {
    match section {
        Section::File => FILE,
        Section::Edit => EDIT,
        Section::View => VIEW,
        Section::Tools => TOOLS,
        Section::Developer => DEVELOPER,
        Section::Settings => SETTINGS,
        Section::Help => HELP,
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    #[test]
    fn standard_desktop_menu_bar_includes_developer() {
        assert_eq!(Section::ALL.map(Section::label),
            ["File", "Edit", "View", "Tools", "Developer", "Settings", "Help"]);
        assert!(Section::ALL.iter().all(|section| !entries(*section).is_empty()));
    }
    #[test]
    fn menu_has_unique_stable_item_keys() {
        let mut keys = HashSet::new();
        for section in Section::ALL {
            assert!(keys.insert(section.key()));
            for item in entries(section) { assert!(keys.insert(item.key)); }
        }
    }
    #[test]
    fn every_tool_is_accessible_but_not_a_separate_home() {
        let all: Vec<_> = Section::ALL.iter()
            .flat_map(|section| entries(*section).iter().map(|item| item.intent)).collect();
        for destination in [
            FirstContact, WikiInspector, Devices, HostStatus, Build,
            KnowledgeGraph, HostDecisions, DeveloperTools, Preferences, About
        ] {
            assert!(all.contains(&Navigate(destination)));
        }
    }
    #[test]
    fn menus_do_not_contain_effect_or_approval_intents() {
        let all: Vec<_> = Section::ALL.iter()
            .flat_map(|section| entries(*section).iter().map(|item| item.intent)).collect();
        assert!(all.contains(&FocusComposer));
        assert!(all.contains(&ClearComposer));
        assert!(all.contains(&RefreshSources));
        assert!(all.contains(&CaptureWindow));
        assert!(all.contains(&OpenScreenshotsFolder));
        assert!(all.contains(&SaveDiagnostics));
        assert!(all.iter().all(|intent| matches!(
            intent, Navigate(_) | RefreshSources | FocusComposer | ClearComposer |
                CaptureWindow | OpenScreenshotsFolder | SaveDiagnostics
        )));
    }
}

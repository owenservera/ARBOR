//! Minimal first-contact view contract for the Direct PWA.
//! Browser DOM events are platform glue; Rust owns admission and the presentation
//! model. Host remains the only authority for commands, approvals and effects.
use serde_json::{json, Value};

pub const SCHEMA: &str = "vivim.first-contact/1";

pub fn project(input: &Value) -> Value {
    let presentation = json!({
        "surface": "composer",
        "target": "vivim-host",
        "placeholder": "Ask anything…",
        "controls": ["text", "send"],
        "requiresPairedDevice": true
    });
    let Some(raw) = input.get("text").and_then(Value::as_str) else {
        return json!({"schema":SCHEMA,"state":"refused","code":"TEXT_REQUIRED",
            "presentation":presentation,"executionAuthorized":false,"effectPerformed":false});
    };
    let text = raw.trim();
    let valid = text.encode_utf16().count() <= 1000
        && !text.chars().any(|c| matches!(c, '\u{0000}'..='\u{0008}'
            | '\u{000B}'..='\u{001F}' | '\u{007F}'));
    if !valid {
        return json!({"schema":SCHEMA,"state":"refused","code":"INVALID_TEXT",
            "presentation":presentation,"executionAuthorized":false,"effectPerformed":false});
    }
    json!({"schema":SCHEMA,"state":if text.is_empty(){"empty"}else{"admitted"},
        "text":text,"presentation":presentation,
        "executionAuthorized":false,"effectPerformed":false})
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn empty_screen_is_inert() {
        let result = project(&json!({"text":""}));
        assert_eq!(result["state"],"empty");
        assert_eq!(result["presentation"]["controls"],json!(["text","send"]));
        assert_eq!(result["effectPerformed"],false);
    }
    #[test]
    fn typed_command_is_only_admitted_never_executed() {
        let result = project(&json!({"text":" show status "}));
        assert_eq!(result["text"],"show status");
        assert_eq!(result["state"],"admitted");
        assert_eq!(result["executionAuthorized"],false);
    }
    #[test]
    fn refuse_invalid_and_oversized_input() {
        assert_eq!(project(&json!({"text":"a".repeat(1001)}))["code"],"INVALID_TEXT");
        assert_eq!(project(&json!({"text":"hi\u{0000}"}))["code"],"INVALID_TEXT");
        assert_eq!(project(&json!({}))["code"],"TEXT_REQUIRED");
    }
}

//! Bounded std-only utility operations adapted from the attached engine_network prototype.
//! @hq:owner repos-hq
//! @hq:invariant No sockets, SQL, filesystem access, external libraries, or persistent mutable state.
//! @hq:invariant Use the existing ComputeEngine/EngineRegistry; never create a second scheduler.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{Error, Result};
use std::collections::BTreeMap;

const MAX_INPUT_BYTES: usize = 64 * 1024;
const MAX_OUTPUT_BYTES: usize = 64 * 1024;
const MAX_STATEMENTS: usize = 128;
const MAX_VARIABLES: usize = 128;
const MAX_VARIABLE_NAME: usize = 128;
const MAX_NUMBERS: usize = 1024;

/// A small deterministic, stateless text/number processor. Each execution
/// has its own script variables; there is no cross-request memory.
pub struct UtilityCompute {
    slot: String,
}
impl UtilityCompute {
    pub fn new(slot: &str) -> Result<Self> {
        if slot.is_empty() || slot.len() > 128 || slot.chars().any(char::is_control) {
            return Err(Error::Invalid("invalid utility engine slot".into()));
        }
        Ok(Self { slot: slot.into() })
    }
    fn number(s: &str) -> Result<f64> {
        let v = s
            .parse::<f64>()
            .map_err(|_| Error::Invalid(format!("invalid finite number: {s}")))?;
        if !v.is_finite() {
            return Err(Error::Invalid(
                "non-finite arithmetic is unsupported".into(),
            ));
        }
        Ok(v)
    }
    fn sum(input: &str) -> Result<String> {
        let mut total = 0.0f64;
        let mut count = 0usize;
        for raw in input
            .split(|c: char| c.is_ascii_whitespace() || c == ',')
            .filter(|s| !s.is_empty())
        {
            count += 1;
            if count > MAX_NUMBERS {
                return Err(Error::Invalid("numeric operand limit exceeded".into()));
            }
            total += Self::number(raw)?;
            if !total.is_finite() {
                return Err(Error::Invalid("numeric overflow".into()));
            }
        }
        if count == 0 {
            return Err(Error::Invalid("sum requires at least one number".into()));
        }
        Ok(total.to_string())
    }
    fn head_tail(s: &str) -> Result<(&str, &str)> {
        let split = s
            .find(char::is_whitespace)
            .ok_or_else(|| Error::Invalid("script command requires an argument".into()))?;
        let (head, rest) = s.split_at(split);
        let rest = rest.trim_start();
        if head.is_empty() || rest.is_empty() {
            return Err(Error::Invalid("script command requires an argument".into()));
        }
        Ok((head, rest))
    }
    fn name(name: &str) -> Result<()> {
        if name.is_empty()
            || name.len() > MAX_VARIABLE_NAME
            || !name.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
        {
            return Err(Error::Invalid("invalid script variable name".into()));
        }
        Ok(())
    }
    fn state_size(vars: &BTreeMap<String, String>) -> usize {
        vars.iter().map(|(k, v)| k.len() + v.len()).sum()
    }
    fn bound_output(output: String) -> Result<String> {
        if output.len() > MAX_OUTPUT_BYTES {
            return Err(Error::Invalid("utility output limit exceeded".into()));
        }
        Ok(output)
    }
    /// Deliberately NOT a general-purpose interpreter. Grammar:
    /// set NAME TEXT; add NAME FINITE_NUMBER; concat NAME TEXT; emit NAME_OR_TEXT
    /// Semicolons separate commands; semicolons inside values are unsupported.
    /// There are no file, shell, network, SQL, graph-mutation or loop commands.
    fn script(input: &str) -> Result<String> {
        let mut vars: BTreeMap<String, String> = BTreeMap::new();
        let mut emitted = Vec::new();
        let mut output_bytes = 0usize;
        for (index, raw) in input.split(';').enumerate() {
            if index >= MAX_STATEMENTS {
                return Err(Error::Invalid("script statement limit exceeded".into()));
            }
            let statement = raw.trim();
            if statement.is_empty() {
                continue;
            }
            let (command, argument) = Self::head_tail(statement)?;
            match command {
                "set" | "concat" | "add" => {
                    let (name, value) = Self::head_tail(argument)?;
                    Self::name(name)?;
                    if !vars.contains_key(name) && vars.len() >= MAX_VARIABLES {
                        return Err(Error::Invalid("script variable limit exceeded".into()));
                    }
                    let next = match command {
                        "set" => value.to_owned(),
                        "concat" => {
                            let mut existing = vars.get(name).cloned().unwrap_or_default();
                            if !existing.is_empty() {
                                existing.push(' ');
                            }
                            existing.push_str(value);
                            existing
                        }
                        _ => {
                            let current = match vars.get(name) {
                                Some(raw) => Self::number(raw)?,
                                None => 0.0,
                            };
                            let next = current + Self::number(value)?;
                            if !next.is_finite() {
                                return Err(Error::Invalid("script addition overflow".into()));
                            }
                            next.to_string()
                        }
                    };
                    vars.insert(name.to_owned(), next);
                    if Self::state_size(&vars) > MAX_OUTPUT_BYTES {
                        return Err(Error::Invalid("script state limit exceeded".into()));
                    }
                }
                "emit" => {
                    let value = vars.get(argument).map(String::as_str).unwrap_or(argument);
                    output_bytes = output_bytes
                        .checked_add(value.len() + usize::from(!emitted.is_empty()))
                        .ok_or_else(|| Error::Invalid("script output limit exceeded".into()))?;
                    if output_bytes > MAX_OUTPUT_BYTES {
                        return Err(Error::Invalid("script output limit exceeded".into()));
                    }
                    emitted.push(value.to_owned());
                }
                _ => {
                    return Err(Error::Unsupported(format!(
                        "unknown utility script command: {command}"
                    )))
                }
            }
        }
        if emitted.is_empty() {
            Self::bound_output(
                vars.into_iter()
                    .map(|(k, v)| format!("{k}={v}"))
                    .collect::<Vec<_>>()
                    .join("\n"),
            )
        } else {
            Self::bound_output(emitted.join("\n"))
        }
    }
}
impl ComputeEngine for UtilityCompute {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(
            &self.slot,
            "hqkg-utility-std-v1",
            "hqkg.utility.v1",
            &["echo", "upper", "sum", "script"],
        )
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        if request.data.len() > MAX_INPUT_BYTES {
            return Err(Error::Invalid("utility input limit exceeded".into()));
        }
        let output = match request.operation.as_str() {
            "echo" => request.data.clone(),
            "upper" => request.data.to_uppercase(),
            "sum" => Self::sum(&request.data)?,
            "script" => Self::script(&request.data)?,
            other => {
                return Err(Error::Unsupported(format!(
                    "unknown utility operation: {other}"
                )))
            }
        };
        Ok(EngineOutput {
            data: Self::bound_output(output)?,
        })
    }
}

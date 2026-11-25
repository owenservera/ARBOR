# Local DeepSeek execution port. No external credential import, no key in argv/stdout.
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$VerbosePreference='SilentlyContinue'
$DebugPreference='SilentlyContinue'
$WarningPreference='SilentlyContinue'
$credential=$null
function Emit($r) { [Console]::Out.WriteLine(($r | ConvertTo-Json -Depth 10 -Compress)) }
try {
    $request=[Console]::In.ReadToEnd() | ConvertFrom-Json -AsHashtable
    if ($request.model -notin @('deepseek-flash','deepseek-v4-pro') -or
        $request.max_tokens -isnot [ValueType] -or $request.max_tokens -lt 1 -or $request.max_tokens -gt 4096 -or
        @($request.messages).Count -lt 1 -or @($request.messages).Count -gt 64) {
        Emit @{state='invalid_request'}; exit 1
    }
    foreach ($m in $request.messages) {
        if ($m.role -notin @('system','user','assistant') -or $m.content -isnot [string] -or $m.content.Length -gt 32768) {
            Emit @{state='invalid_request'}; exit 1
        }
    }
    $vault=Join-Path $env:LOCALAPPDATA 'VIVIM\credentials\deepseek.dpapi'
    if (-not [IO.File]::Exists($vault)) { Emit @{state='not_configured'}; exit 1 }
    $credential=ConvertTo-SecureString ([IO.File]::ReadAllText($vault))
    $body=@{model=$request.model;messages=$request.messages;max_tokens=[int]$request.max_tokens;thinking=@{type='disabled'};stream=$false}
    $r=Invoke-RestMethod -Method Post -Uri 'https://api.deepseek.com/chat/completions' -Authentication Bearer -Token $credential -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10 -Compress) -MaximumRedirection 0 -TimeoutSec 60
    $choice=$r.choices[0]
    if ($choice.message.content -isnot [string] -or $choice.finish_reason -notin @('stop','length')) {Emit @{state='invalid_response'}; exit 1}
    Emit @{state='completed';model=$request.model;content=$choice.message.content;finishReason=$choice.finish_reason;usage=@{inputTokens=[int]$r.usage.prompt_tokens;outputTokens=[int]$r.usage.completion_tokens}}
} catch {
    $status=0
    try {$status=[int]$_.Exception.Response.StatusCode} catch {}
    Emit @{state='provider_error';httpStatus=$status}
    exit 1
} finally {if($credential){$credential.Dispose()}}

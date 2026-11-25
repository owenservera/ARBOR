# Windows owner-session helper; never accepts a credential on argv, stdin, MCP or stdout.
param([Parameter(Mandatory=$true)][ValidateSet('import','verify')][string]$Mode)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
$VerbosePreference = 'SilentlyContinue'
$DebugPreference = 'SilentlyContinue'
function Receipt([string]$State, [string[]]$Models = @()) {
    [Console]::Out.WriteLine((@{state=$State;models=@($Models)} | ConvertTo-Json -Compress))
}
function Probe([Security.SecureString]$Token) {
    try {
        $response = Invoke-RestMethod -Method Get -Uri 'https://api.deepseek.com/models' -Authentication Bearer -Token $Token -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction Stop
        $models = @('deepseek-flash','deepseek-v4-pro' | Where-Object { $_ -in @($response.data.id) })
        if ($models.Count -eq 0) { return @{state='probe_failed';models=@()} }
        return @{state='verified';models=$models}
    } catch {
        $status = 0
        try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq 401 -or $status -eq 403) { return @{state='authentication_failed';models=@()} }
        return @{state='probe_failed';models=@()}
    }
}
$secret = $null
$temp = $null
try {
    if (-not $IsWindows -or -not $env:LOCALAPPDATA) { Receipt 'local_error'; exit 0 }
    $dir = Join-Path $env:LOCALAPPDATA 'VIVIM\credentials'
    $vault = Join-Path $dir 'deepseek.dpapi'
    if ($Mode -eq 'verify') {
        if (-not [IO.File]::Exists($vault)) { Receipt 'not_configured'; exit 0 }
        $secret = ConvertTo-SecureString ([IO.File]::ReadAllText($vault))
        $result = Probe $secret
        Receipt $result.state $result.models
        exit 0
    }
    if ([IO.File]::Exists($vault)) { Receipt 'already_configured'; exit 0 }
    if (-not [Environment]::UserInteractive) { Receipt 'local_error'; exit 0 }
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $form = [Windows.Forms.Form]::new()
    $form.Text = 'VIVIM - Enroll DeepSeek API credential'
    $form.Size = [Drawing.Size]::new(540,220)
    $form.StartPosition = 'CenterScreen'
    $form.TopMost = $true
    $label = [Windows.Forms.Label]::new()
    $label.Location = [Drawing.Point]::new(16,16)
    $label.Size = [Drawing.Size]::new(490,68)
    $label.Text = 'In the official DeepSeek platform tab, sign in if required and create a new API key. Paste ONLY that new API key here. Do not enter your account password or Windows PIN.'
    $input = [Windows.Forms.TextBox]::new()
    $input.Location = [Drawing.Point]::new(16,92)
    $input.Width = 490
    $input.UseSystemPasswordChar = $true
    $input.MaxLength = 256
    $ok = [Windows.Forms.Button]::new()
    $ok.Text = 'Verify and save'
    $ok.Location = [Drawing.Point]::new(275,130)
    $ok.Width = 130
    $ok.DialogResult = [Windows.Forms.DialogResult]::OK
    $cancel = [Windows.Forms.Button]::new()
    $cancel.Text = 'Cancel'
    $cancel.Location = [Drawing.Point]::new(415,130)
    $cancel.Width = 90
    $cancel.DialogResult = [Windows.Forms.DialogResult]::Cancel
    $form.Controls.AddRange(@($label,$input,$ok,$cancel))
    $form.AcceptButton = $ok
    $form.CancelButton = $cancel
    try {
        if ($form.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { Receipt 'cancelled'; exit 0 }
        if ($input.Text -notmatch '^sk-[A-Za-z0-9_-]{16,253}$') { Receipt 'authentication_failed'; exit 0 }
        $secret = ConvertTo-SecureString $input.Text -AsPlainText -Force
    } finally { $input.Clear(); $form.Dispose() }
    $result = Probe $secret
    if ($result.state -ne 'verified') { Receipt $result.state; exit 0 }
    # With no key parameter, Windows PowerShell SecureString conversion uses
    # the current user's DPAPI protection. Store encrypted material outside the repo.
    [void][IO.Directory]::CreateDirectory($dir)
    $temp = Join-Path $dir ([Guid]::NewGuid().ToString('N') + '.pending')
    [IO.File]::WriteAllText($temp,(ConvertFrom-SecureString -SecureString $secret))
    try { [IO.File]::Move($temp,$vault) }
    catch {
        if ([IO.File]::Exists($vault)) { Receipt 'already_configured'; exit 0 }
        throw
    }
    Receipt 'verified' $result.models
} catch { Receipt 'local_error' }
finally {
    if ($null -ne $secret) { $secret.Dispose() }
    if ($temp -and [IO.File]::Exists($temp)) { try { [IO.File]::Delete($temp) } catch {} }
}

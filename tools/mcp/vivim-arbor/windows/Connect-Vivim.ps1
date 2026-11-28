[CmdletBinding()]
param([switch]$Prepare,[switch]$Check,[switch]$Unattended,[switch]$ReplaceCredential)
if ($Unattended -and $ReplaceCredential) { throw 'Credential replacement requires local interactive authorization.' }
$ErrorActionPreference = 'Stop'
$version = 'v0.0.21'
$asset = "tunnel-client-$version-windows-amd64.zip"
$expected = '2faf80ae62b58485fcef534cd3f78cd8b82e71cb04d14c2a5c73dbb4eb6c575a'
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'server\tunnel-readonly.cjs'
$runtime = Join-Path $root "runtime\$version"
$zip = Join-Path $runtime $asset
$node = (Get-Command node.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
if (-not (Test-Path -LiteralPath $server -PathType Leaf)) { throw 'Scoped MCP server missing.' }
function Install-TunnelClient {
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    if (-not (Test-Path -LiteralPath $zip)) {
        $pending = "$zip.partial"
        try {
            Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/openai/tunnel-client/releases/download/$version/$asset" -OutFile $pending
            if ((Get-FileHash -LiteralPath $pending -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Official release archive checksum mismatch.' }
            Move-Item -LiteralPath $pending -Destination $zip
        } finally { if (Test-Path -LiteralPath $pending) { Remove-Item -LiteralPath $pending -Force } }
    }
    if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Cached release archive checksum mismatch.' }
    $target = Join-Path $runtime 'verified'
    # Check the exe against its bytes in the verified ZIP on every run.
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($zip)
    try {
        $entries = @($archive.Entries | Where-Object { $_.Name -eq 'tunnel-client.exe' })
        if ($entries.Count -ne 1) { throw 'Expected one official tunnel-client executable.' }
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        $exe = Join-Path $target 'tunnel-client.exe'
        $stream = $entries[0].Open()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $exeHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
        finally { $sha.Dispose(); $stream.Dispose() }
        if (-not (Test-Path -LiteralPath $exe)) {
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entries[0], $exe, $false)
        }
        if ((Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant() -ne $exeHash) { throw 'Installed executable checksum mismatch.' }
        return $exe
    } finally { $archive.Dispose() }
}
function Test-LocalMcp {
    $env:VIVIM_TUNNEL_HOST_DISCOVERY = '0'
    $env:VIVIM_TUNNEL_FORCE_HEALTH_ONLY = '1'
    $messages = @(
        '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}',
        '{"jsonrpc":"2.0","method":"notifications/initialized"}',
        '{"jsonrpc":"2.0","id":2,"method":"tools/list"}',
        '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"vivim_tunnel_health"}}'
    )
    try { $lines = @($messages | & $node $server) }
    finally { Remove-Item Env:VIVIM_TUNNEL_FORCE_HEALTH_ONLY -ErrorAction SilentlyContinue }
    if ($LASTEXITCODE -ne 0 -or $lines.Count -ne 3) { throw 'Local MCP handshake failed.' }
    $list = $lines[1] | ConvertFrom-Json
    $response = $lines[2] | ConvertFrom-Json
    if (@($list.result.tools).Count -ne 1 -or $list.result.tools[0].name -ne 'vivim_tunnel_health') { throw 'Unexpected remote tool surface.' }
    $health = $response.result.content[0].text | ConvertFrom-Json
    if ($health.status -ne 'ready' -or $health.hostDiscovery -ne $false) { throw 'Local MCP health check failed.' }
    Write-Host 'Local MCP health-only handshake: PASS'
}
$exe = Install-TunnelClient
& $exe --version
if ($LASTEXITCODE -ne 0) { throw 'Tunnel client version probe failed.' }
Test-LocalMcp
if ($Prepare -or $Check) {
    Write-Host 'Local prerequisites ready. No remote connection attempted.'
    exit 0
}
# Use only the dedicated local binding; no generic desktop adapter.
$env:VIVIM_TUNNEL_HOST_DISCOVERY = '0'
Remove-Item Env:VIVIM_MCP_HOST_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:MCP_SERVER_URL -ErrorAction SilentlyContinue
Remove-Item Env:MCP_COMMAND -ErrorAction SilentlyContinue
$state = Join-Path $env:LOCALAPPDATA 'VIVIM\ARBOR-Connect'
New-Item -ItemType Directory -Path $state -Force | Out-Null
$idFile = Join-Path $state 'tunnel-id.txt'
$id = if (Test-Path -LiteralPath $idFile) { (Get-Content -LiteralPath $idFile -Raw).Trim() } else { '' }
if ($id -notmatch '^tunnel_(?:[a-z0-9]{4}_)?[a-z0-9]{32}$') {
    if ($Unattended) { throw 'Existing tunnel identity has not been provisioned.' }
    Write-Host 'Create or select your private tunnel: https://platform.openai.com/settings/organization/tunnels'
    $id = (Read-Host 'Tunnel ID').Trim()
    if ($id -notmatch '^tunnel_(?:[a-z0-9]{4}_)?[a-z0-9]{32}$') { throw 'Invalid tunnel ID; no connection made.' }
    Set-Content -LiteralPath $idFile -Value $id -Encoding ASCII
}
# Use a DPAPI-protected credential belonging to this Windows account and tunnel ID.
# A new identity or revoked key requires explicit local authorization; never extract
# secrets from a running process, reuse another account, or write plaintext.
$credentialFile = Join-Path $state 'credential.json'
$key = $null
$save = $false
try {
    if (-not $ReplaceCredential -and (Test-Path -LiteralPath $credentialFile -PathType Leaf)) {
        $record = Get-Content -LiteralPath $credentialFile -Raw | ConvertFrom-Json
        if ($record.schema -ne 'vivim.arbor.connection/1') { throw 'Invalid protected connection record.' }
        if ($record.tunnelId -ceq $id) {
            $key = ConvertTo-SecureString ([string]$record.protectedKey) -ErrorAction Stop
        }
    }
    if (-not $key) {
        if ($Unattended) { throw 'No protected credential for this tunnel; local owner authorization required.' }
        $key = Read-Host 'Authorize the existing tunnel once (hidden; encrypted for this Windows account)' -AsSecureString
        $save = $true
    }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
    try { $env:CONTROL_PLANE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    if ($env:CONTROL_PLANE_API_KEY -notmatch '^sk-[A-Za-z0-9_-]+$') { throw 'Missing or invalid runtime credential.' }
    if ($save) {
        $pending = Join-Path $state ([IO.Path]::GetRandomFileName())
        try {
            @{schema='vivim.arbor.connection/1';tunnelId=$id;protectedKey=(ConvertFrom-SecureString $key)} |
                ConvertTo-Json -Compress | Set-Content -LiteralPath $pending -Encoding utf8
            if (Test-Path -LiteralPath $credentialFile) {
                [IO.File]::Replace($pending,$credentialFile,$null)
            } else { [IO.File]::Move($pending,$credentialFile) }
        } finally { Remove-Item -LiteralPath $pending -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue
    throw
} finally { if ($key) { $key.Dispose() } }
$env:CONTROL_PLANE_TUNNEL_ID = $id
# A forward-slash absolute path avoids shell escape ambiguity; both paths quoted.
$binding = '"' + $node.Replace('\','/') + '" "' + $server.Replace('\','/') + '"'
$env:MCP_COMMAND = $binding
$healthFile = Join-Path $state 'health-url.txt'
$mutex = New-Object Threading.Mutex($false,'Local\VIVIM-ARBOR-Tunnel')
$owned = $false
try {
    $owned = $mutex.WaitOne(0)
    if (-not $owned) { throw 'VIVIM connection already running in this Windows session.' }
    Remove-Item -LiteralPath $healthFile -ErrorAction SilentlyContinue
    Write-Host 'Starting private tunnel. Keep this window open. Ctrl+C disconnects.'
    Write-Host "Local health URL file: $healthFile"
    & $exe run --control-plane.tunnel-id $id --health.listen-addr 127.0.0.1:0 --health.url-file $healthFile
    $result = $LASTEXITCODE
} finally {
    Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue
    if ($owned) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
exit $result

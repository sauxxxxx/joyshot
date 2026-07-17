$ErrorActionPreference = "Stop"

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
  throw "mkcert is required. Install it with: winget install FiloSottile.mkcert"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$certificateDirectory = Join-Path $projectRoot "certificates"
New-Item -ItemType Directory -Force -Path $certificateDirectory | Out-Null

$lanAddresses = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.AddressState -eq "Preferred"
  } |
  Select-Object -ExpandProperty IPAddress -Unique

if (-not $lanAddresses) {
  throw "No active LAN IPv4 address was found. Connect to the network and try again."
}

& mkcert -install
if ($LASTEXITCODE -ne 0) { throw "mkcert could not install its local certificate authority." }

$keyPath = Join-Path $certificateDirectory "lan-key.pem"
$certificatePath = Join-Path $certificateDirectory "lan.pem"
$hosts = @("localhost", "127.0.0.1", "::1") + @($lanAddresses)
& mkcert -key-file $keyPath -cert-file $certificatePath @hosts
if ($LASTEXITCODE -ne 0) { throw "mkcert could not generate the LAN certificate." }

$caRoot = (& mkcert -CAROOT).Trim()
Copy-Item -LiteralPath (Join-Path $caRoot "rootCA.pem") -Destination (Join-Path $certificateDirectory "lan-rootCA.pem") -Force

Write-Host "Local HTTPS is ready. Run: npm run dev:https"
foreach ($address in $lanAddresses) {
  Write-Host "LAN URL: https://${address}:3000"
}
Write-Host "For another computer, import certificates/lan-rootCA.pem into its current user's Trusted Root Certification Authorities store."

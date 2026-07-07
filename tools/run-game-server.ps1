param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$preferredPort = 4173
$maxPort = 4199

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "text/javascript; charset=utf-8"; break }
    ".mjs" { "text/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".gif" { "image/gif"; break }
    ".svg" { "image/svg+xml"; break }
    ".ico" { "image/x-icon"; break }
    default { "application/octet-stream"; break }
  }
}

function Write-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  $headerText = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Send-Text {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$Message
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Message)
  Write-Response -Stream $Stream -StatusCode $StatusCode -StatusText $StatusText -Body $bytes
}

$listener = $null
$port = $preferredPort

while ($port -le $maxPort) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.Start()
    break
  } catch {
    $port += 1
    $listener = $null
  }
}

if ($null -eq $listener) {
  Write-Host "게임을 실행할 빈 포트를 찾지 못했습니다. 잠시 후 다시 실행해주세요."
  Read-Host "Enter를 누르면 창이 닫힙니다"
  exit 1
}

$url = "http://127.0.0.1:$port/index.html"
Write-Host ""
Write-Host "직무수학 RPG를 실행합니다."
Write-Host "게임 주소: $url"
Write-Host ""
Write-Host "이 창은 게임을 켜두는 역할을 합니다."
Write-Host "게임을 끝낼 때 이 창을 닫아도 됩니다."
Write-Host ""

if (-not $NoBrowser) {
  Start-Process $url
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) {
          break
        }
      }

      $parts = $requestLine.Split(" ")
      if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
        Send-Text -Stream $stream -StatusCode 405 -StatusText "Method Not Allowed" -Message "GET 요청만 지원합니다."
        continue
      }

      $requestPath = $parts[1].Split("?")[0]
      $requestPath = [System.Uri]::UnescapeDataString($requestPath)

      if ($requestPath -eq "/") {
        $requestPath = "/index.html"
      }

      $relativePath = $requestPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
      $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relativePath))

      if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Message "허용되지 않은 경로입니다."
        continue
      }

      if (-not [System.IO.File]::Exists($fullPath)) {
        Send-Text -Stream $stream -StatusCode 404 -StatusText "Not Found" -Message "파일을 찾을 수 없습니다."
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($fullPath)
      $contentType = Get-ContentType -Path $fullPath
      Write-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
    } catch {
      try {
        if ($null -ne $stream) {
          Send-Text -Stream $stream -StatusCode 500 -StatusText "Internal Server Error" -Message "게임 파일을 여는 중 문제가 생겼습니다."
        }
      } catch {
      }
    } finally {
      $client.Close()
    }
  }
} finally {
  if ($null -ne $listener) {
    $listener.Stop()
  }
}

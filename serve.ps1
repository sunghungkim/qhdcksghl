# 로컬 미리보기 서버 (npm·python 필요 없음). 이 폴더를 http://localhost:8780/ 으로 보여 줍니다.
# 사용:  powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 [-Port 8780]
# 멈추기: 창에서 Ctrl+C.  (컴퓨터를 껐다 켜면 꺼지므로 다시 실행해야 합니다.)
# index.html 은 file:// 로 직접 열면 메뉴 페이지가 불러와지지 않으니, 꼭 이 서버(http)로 열어야 합니다.
param([int]$Port = 8780)

$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json'; '.txt' = 'text/plain; charset=utf-8'; '.svg' = 'image/svg+xml'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'
  '.mp4' = 'video/mp4'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [uri]::UnescapeDataString($ctx.Request.Url.LocalPath)
    if ($rel -eq '/') { $rel = '/index.html' }
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel.TrimStart('/')))
    $inRoot = $full.StartsWith($Root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
    $blocked = ($full -like '*\.git\*') -or ($full -like '*\.claude\*')   # 저장소 내부 파일은 내보내지 않음

    if ($inRoot -and -not $blocked -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $res.Headers.Add('Cache-Control', 'no-cache')   # 고친 파일이 바로 보이게
      $bytes = [System.IO.File]::ReadAllBytes($full)  # 파일을 통째로 보냄 (동영상도 작아서 문제없음)
      $res.StatusCode = 200
      $res.ContentLength64 = $bytes.Length
      if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } else {
      $res.StatusCode = 404
    }
  } catch {
    # 브라우저가 중간에 연결을 끊는 경우(동영상 건너뛰기 등)는 무시
  }
  try { $res.Close() } catch {}
}

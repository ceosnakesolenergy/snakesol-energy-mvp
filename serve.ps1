# Força o diretório de trabalho para a pasta onde este script está salvo
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ($scriptPath) { Set-Location $scriptPath }

$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Servidor rodando em http://localhost:$port/"

# Abrir o navegador automaticamente de forma segura
try {
    Start-Process "http://localhost:$port/"
} catch {
    Write-Host "Por favor, abra o navegador manualmente em: http://localhost:$port/"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $response.Headers["X-Content-Type-Options"] = "nosniff"
        $response.Headers["X-Frame-Options"] = "DENY"
        $response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        $response.Headers["Cross-Origin-Resource-Policy"] = "same-origin"
        $response.Headers["Cross-Origin-Opener-Policy"] = "same-origin"
        $response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        $response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://bundle.run https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com; font-src 'self' https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; connect-src 'self' https://api.devnet.solana.com https://api.mainnet-beta.solana.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ($localPath -eq "") { $localPath = "index.html" }
        
        # Corrige as barras no path
        $localPath = $localPath -replace '/', '\'
        $filePath = Join-Path (Get-Location).Path $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".png"  { $response.ContentType = "image/png" }
                default { $response.ContentType = "application/octet-stream" }
            }
            $buffer = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    Write-Host "Erro ou servidor parado: $_"
} finally {
    $listener.Stop()
}
Write-Host "Pressione ENTER para sair..."
Read-Host

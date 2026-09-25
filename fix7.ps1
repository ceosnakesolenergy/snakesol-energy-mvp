$content = Get-Content 'app.js' -Raw -Encoding UTF8
$content = $content.Replace('\n\n', "

")
[System.IO.File]::WriteAllText('c:\Users\Giovani\Downloads\SNAKESOLENERGY_App\app.js', $content, [System.Text.Encoding]::UTF8)

$content = Get-Content 'app.js' -Raw -Encoding UTF8
$content = $content -replace 'Endere[^\x20-\x7E]+o do Ativo:<br>SnK\.\.\.x892', 'Endereço do Ativo:<br>SnK...'' + Math.random().toString(36).substring(2, 6).toUpperCase()'
$content = $content -replace 'Aquisi[^\x20-\x7E]+o de N[^\x20-\x7E]+ Confirmada!', 'Aquisição de Nó Confirmada! <br><span class="text-sm text-brand-accent">Edição #'' + (Math.floor(Math.random() * 8999) + 1000) + ''</span>'
[System.IO.File]::WriteAllText('c:\Users\Giovani\Downloads\SNAKESOLENERGY_App\app.js', $content, [System.Text.Encoding]::UTF8)

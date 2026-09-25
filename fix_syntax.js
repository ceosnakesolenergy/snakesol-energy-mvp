const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
// Fix broken literal newlines inside strings
code = code.replace(/"([^"]*)\r?\n\r?\n([^"]*)"/g, '"\\n\\n"');
code = code.replace(/"([^"]*)\r?\n([^"]*)"/g, '"\\n"');
// Re-run to catch multiple
code = code.replace(/"([^"]*)\r?\n\r?\n([^"]*)"/g, '"\\n\\n"');
fs.writeFileSync('app.js', code, 'utf8');

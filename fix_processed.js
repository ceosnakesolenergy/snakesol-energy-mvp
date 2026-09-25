const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace all 'confirmed' with 'processed' EXCEPT where it's part of a message like 'nao confirmou'
code = code.replace(/'confirmed'/g, "'processed'");

fs.writeFileSync('app.js', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(/error\.message\.toLowerCase\(\)\.includes\("insufficient"\) \|\| error\.message\.includes\("0x1"\)/g, 'error.message.toLowerCase().includes("insufficient") || error.message.includes("0x1") || error.message.includes("Attempt to debit") || error.message.includes("Simulation failed")');

fs.writeFileSync('app.js', code, 'utf8');

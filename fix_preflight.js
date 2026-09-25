const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Enable preflight simulation to catch insufficient funds errors properly
code = code.replace(/{ skipPreflight: true }/g, '{ skipPreflight: false }');

// Lower the priority fee from 100 million to 1 million (still high but safer for low balances)
code = code.replace(/microLamports: 100000000/g, 'microLamports: 1000000');

fs.writeFileSync('app.js', code, 'utf8');

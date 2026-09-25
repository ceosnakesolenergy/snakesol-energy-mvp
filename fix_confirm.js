const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace both confirmTransaction blocks with a fast timeout
const confirmRegex = /await connection\.confirmTransaction\(\{\s*signature: signature,\s*blockhash: latestBlockhash\.blockhash,\s*lastValidBlockHeight: latestBlockhash\.lastValidBlockHeight\s*\}, 'processed'\);/g;

code = code.replace(confirmRegex, // Hackathon UX: Espera apenas 1.5s após a Phantom assinar para evitar lentidão extrema da Devnet\n            await new Promise(resolve => setTimeout(resolve, 1500)););

fs.writeFileSync('app.js', code, 'utf8');

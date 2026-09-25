const web3 = require('@solana/web3.js');
try {
    const pk = new web3.PublicKey('DeMo9xyzXXXXXXXXXXXXXXXXXXXXX123456789SNaKe');
    console.log('Valid');
} catch (e) {
    console.log('Error: ' + e.message);
}

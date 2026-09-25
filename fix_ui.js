const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const newHandleConnect =     async function handleConnect(publicKey) {
        userPublicKey = publicKey;
        isPhantomConnected = true;
        window.isPhantomConnected = true;

        // Old fallback
        const connectBtns = document.querySelectorAll('.btn-connect');
        connectBtns.forEach(btn => {
            btn.innerHTML = \<i class="fa-solid fa-wallet mr-2"></i> \...\\;
            btn.classList.replace('bg-brand-purple', 'bg-brand-accent');
            btn.classList.add('text-black');
        });

        // New UI update
        const mainBtn = document.getElementById('connect-wallet-btn');
        if (mainBtn) {
            mainBtn.classList.remove('bg-[#9945FF]', 'hover:bg-[#8338e3]', 'shadow-[0_0_15px_rgba(153,69,255,0.4)]', 'text-white');
            mainBtn.classList.add('bg-brand-accent', 'hover:bg-[#0ea5e9]', 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', 'text-black');
            
            const txt = document.getElementById('connect-text');
            if (txt) txt.innerText = publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4);
            
            const dot = document.getElementById('status-dot');
            if (dot) {
                dot.classList.remove('bg-red-500', 'animate-pulse');
                dot.classList.add('bg-black');
            }
        }

        window.showToast("Carteira conectada com sucesso!", "success");
        if (window.renderBadges) window.renderBadges();
    };

code = code.replace(/    async function handleConnect\(publicKey\) {[\s\S]*?if \(window\.renderBadges\) window\.renderBadges\(\);\n    }/, newHandleConnect);

fs.writeFileSync('app.js', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace('const phantomProvider = getProvider();\\n\\n        try {\\n            let signature = \\'\\';\\n            let validPublicKey = userPublicKey;',
\const phantomProvider = getProvider();

        try {
            let signature = '';
            
            // MOCK WALLET FALLBACK
            if (!phantomProvider) {
                if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Simulando...';
                await new Promise(resolve => setTimeout(resolve, 2000));
                signature = 'mockTx' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                window.addLogEntry(actionName, signature);
                window.updateMockBalances(actionName);
                if (actionName.includes('Equipamento IoT') || actionName.includes('Carregador VE') || actionName.includes('hardware')) {
                    window.showNFTModal();
                } else {
                    window.showToast("✅ Transação Confirmada!\\n\\n(Modo Demonstração: Nenhuma blockchain real foi usada).", "success", 8000);
                }
                return;
            }

            let validPublicKey = userPublicKey;\);

code = code.replace('const phantomProvider = getProvider();\\n\\n        try {\\n            let signature = \\'\\';\\n            let validPublicKey = userPublicKey;\\n            if (typeof userPublicKey === \\'string\\') {',
\const phantomProvider = getProvider();

        try {
            let signature = '';
            
            // MOCK WALLET FALLBACK
            if (!phantomProvider) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                signature = 'vote' + Math.random().toString(16).substr(2, 8);
                btn.innerHTML = originalHtml;
                btn.classList.add('border-[#14F195]', 'bg-[#14F195]/10');
                document.getElementById('vote-feedback').classList.remove('hidden');
                if (window.showToast) window.showToast('Voto computado com sucesso! (Modo Simulação)', 'success');
                if (window.addLogEntry) window.addLogEntry('Voto DAO: Proposta #042', signature);
                return;
            }

            let validPublicKey = userPublicKey;
            if (typeof userPublicKey === 'string') {\);

fs.writeFileSync('app.js', code, 'utf8');

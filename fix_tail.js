const fs = require('fs');
let lines = fs.readFileSync('app.js', 'utf8').split('\n');

// We know line 418 is: if (!hasBadges) container.innerHTML = ...
// Let's find it safely
let spliceIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('if (!hasBadges) container.innerHTML')) {
        spliceIndex = i;
        break;
    }
}

if (spliceIndex !== -1) {
    const tail = \        if (!hasBadges) container.innerHTML = '<p class="text-sm text-gray-500 w-full text-center py-6 italic">Realize ações na plataforma para desbloquear medalhas.</p>';
    };
    
    // Vote DAO
    window.voteDao = async function(option) {
        if (!window.isPhantomConnected || !userPublicKey) {
            if (window.showToast) window.showToast('Conecte sua carteira para votar!', 'error');
            return;
        }
        if (window.mockState.snake < 50) {
            if (window.showToast) window.showToast('Stake insuficiente! Necessário 50 .', 'error');
            return;
        }
        
        const btn = document.getElementById('btn-vote-' + option);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="flex justify-center items-center py-2"><i class="fa-solid fa-circle-notch fa-spin text-white"></i></div>';
        
        const phantomProvider = getProvider();

        try {
            let signature = '';
            let validPublicKey = userPublicKey;
            if (typeof userPublicKey === 'string') {
                validPublicKey = new solanaWeb3.PublicKey(userPublicKey);
            }

            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
            const transaction = new solanaWeb3.Transaction();
            
            transaction.add(
                solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 100000000
                })
            );

            transaction.add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: validPublicKey,
                    toPubkey: validPublicKey,
                    lamports: 100
                })
            );

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = validPublicKey;

            const resp = await phantomProvider.signAndSendTransaction(transaction, { skipPreflight: true });
            signature = typeof resp === 'string' ? resp : resp.signature;
            
            await connection.confirmTransaction({
                signature: signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

            if (window.showToast) window.showToast('Voto computado com sucesso na Devnet!', 'success');

            btn.innerHTML = originalHtml;
            btn.classList.add('border-[#14F195]', 'bg-[#14F195]/10');
            document.getElementById('vote-feedback').classList.remove('hidden');
            if (window.addLogEntry) window.addLogEntry('Voto DAO: Proposta #042', signature);
        } catch (error) {
            console.error("Erro ao votar:", error);
            if (error.message && (error.message.includes("block height exceeded") || error.message.includes("expired") || error.message.includes("timeout") || error.message.includes("not confirmed"))) {
                if (window.showToast) window.showToast("⚠️ Voto Enviado (Rede Lenta)!\\n\\nA Devnet está congestionada e não confirmou a tempo, mas a transação foi enviada.", "warning", 8000);
                btn.innerHTML = originalHtml;
                btn.classList.add('border-[#14F195]', 'bg-[#14F195]/10');
                document.getElementById('vote-feedback').classList.remove('hidden');
                if (window.addLogEntry && signature) window.addLogEntry('Voto DAO: Proposta #042', signature);
            } else if (error.message && (error.message.toLowerCase().includes("insufficient") || error.message.includes("0x1"))) {
                window.showToast("🚫 Saldo Insuficiente!\\n\\nVocê precisa de SOL (Devnet) para pagar as taxas. Acesse faucet.solana.com para pegar moedas de teste.", "error", 8000);
                btn.innerHTML = originalHtml;
            } else if (error.message && error.message.includes("User rejected")) {
                window.showToast("Você cancelou a assinatura do voto.", "info", 5000);
                btn.innerHTML = originalHtml;
            } else {
                window.showToast("Erro ao confirmar voto na blockchain.", "error");
                btn.innerHTML = originalHtml;
            }
        }
    };

    // Inicializar chamadas seguras
    window.updateMockBalances('');
});\

    lines = lines.slice(0, spliceIndex);
    lines.push(tail);
    fs.writeFileSync('app.js', lines.join('\\n'), 'utf8');
}

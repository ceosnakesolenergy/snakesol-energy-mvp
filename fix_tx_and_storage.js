const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace signAndSendTransaction with signTransaction + sendRawTransaction
const signRegex = /const resp = await phantomProvider\.signAndSendTransaction\(transaction, \{ skipPreflight: false \}\);\s*signature = typeof resp === 'string' \? resp : resp\.signature;/g;
code = code.replace(signRegex, const signedTransaction = await phantomProvider.signTransaction(transaction);\n            signature = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false }););

// Update addLogEntry to use localStorage
const addLogEntryRegex = /window\.addLogEntry = function\(actionName, signature\) \{([\s\S]*?)        logList\.insertBefore\(newLog, logList\.firstChild\);\n        if \(logList\.children\.length > 5\) logList\.removeChild\(logList\.lastChild\);\n    \};/;

const newAddLogEntry = window.addLogEntry = function(actionName, signature, saveToStorage = true) {
        const logList = document.getElementById('tx-log');
        if (!logList) return;
        
        const emptyMsg = document.getElementById('empty-log-msg');
        if (emptyMsg) emptyMsg.style.display = 'none';
        
        const shortSig = signature.slice(0, 4) + '...' + signature.slice(-4);
        const linkHtml = \<a href="https://explorer.solana.com/tx/\?cluster=devnet" class="text-xs text-[#9945FF] hover:underline" target="_blank" title="Ver na Solana">Ver no Explorer <i class="fa-solid fa-external-link-alt text-[10px]"></i></a>\;

        const newLog = document.createElement('div');
        newLog.className = 'flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl text-sm animate-[fade-in_0.3s_ease-out] mb-2';
        newLog.innerHTML = \
            <div>
                <p class="font-bold text-white mb-1">\</p>
                <div class="flex items-center gap-2">
                    <code class="text-xs text-brand-accent bg-brand-accent/10 px-2 py-1 rounded"><i class="fa-brands fa-solana"></i> \</code>
                    <button onclick="navigator.clipboard.writeText('\')" class="text-gray-400 hover:text-white transition-colors" title="Copiar TX">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="flex flex-col items-end">
                \
                <span class="text-xs text-gray-500 mt-1">Agora mesmo</span>
            </div>
        \;
        
        logList.insertBefore(newLog, logList.firstChild);
        if (logList.children.length > 20) logList.removeChild(logList.lastChild);
        
        if (saveToStorage) {
            let history = JSON.parse(localStorage.getItem('snakeTxHistory') || '[]');
            history.unshift({ actionName, signature });
            if (history.length > 20) history.pop();
            localStorage.setItem('snakeTxHistory', JSON.stringify(history));
        }
    };
    
    // Load history on init
    window.loadTxHistory = function() {
        const history = JSON.parse(localStorage.getItem('snakeTxHistory') || '[]');
        history.reverse().forEach(tx => {
            window.addLogEntry(tx.actionName, tx.signature, false);
        });
    };;

code = code.replace(addLogEntryRegex, newAddLogEntry);

// Add window.loadTxHistory() at the end of the init block
code = code.replace(/window\.updateMockBalances\(''\);\n\}\);/, "window.updateMockBalances('');\n    window.loadTxHistory();\n});");

fs.writeFileSync('app.js', code, 'utf8');

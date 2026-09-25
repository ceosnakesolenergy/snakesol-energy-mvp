const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const newMockBalances =     window.updateMockBalances = function(action) {
        const act = action.toLowerCase();
        if (act.includes('comprar ') || act.includes('energy')) {
            // Se for da DEX, pega o valor calculado
            const swapOut = document.getElementById('swap-output');
            let amount = 100;
            if (act.includes('swap') && swapOut && swapOut.value) {
                amount = parseFloat(swapOut.value);
            }
            window.mockState.energy += amount;
            
            const solBal = document.getElementById('dex-sol-balance');
            if (solBal && act.includes('swap')) {
                const swapIn = document.getElementById('swap-input');
                if (swapIn && swapIn.value) {
                    solBal.innerText = Math.max(0, parseFloat(solBal.innerText) - parseFloat(swapIn.value)).toFixed(2);
                }
            }
        } else if (act.includes('equipamento iot') || act.includes('carregador ve') || act.includes('hardware')) {
            if (window.mockState.energy >= 10) window.mockState.energy -= 10;
            window.mockState.hw += 1;
        } else if (act.includes('stake')) {
            if (window.mockState.energy >= 50) {
                window.mockState.energy -= 50;
                window.mockState.snake += 50;
            }
        };

code = code.replace(/    window\.updateMockBalances = function\(action\) {[\s\S]*?            }\n        }/, newMockBalances);

fs.writeFileSync('app.js', code, 'utf8');

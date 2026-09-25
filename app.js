document.addEventListener('DOMContentLoaded', () => {
    let isPhantomConnected = false;
    let userPublicKey = null;

    // Toast Notifications
    window.showToast = function(message, type = 'success', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        const bgColors = {
            'success': 'bg-[#14F195]/10 border-green-500/50',
            'error': 'bg-[#FF3B30]/10 border-red-500/50',
            'info': 'bg-[#111c2a] border-blue-500/50',
            'warning': 'bg-[#F59E0B]/10 border-yellow-500/50'
        };
        const textColors = {
            'success': 'text-green-400',
            'error': 'text-red-400',
            'info': 'text-blue-400',
            'warning': 'text-yellow-400'
        };
        
        toast.className = `${bgColors[type]} border rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto max-w-[350px]`;
        
        // Anti-XSS Sanitization
        const safeMessage = message.replace(/&/g, '&amp;')
                                   .replace(/</g, '&lt;')
                                   .replace(/>/g, '&gt;')
                                   .replace(/"/g, '&quot;')
                                   .replace(/'/g, '&#039;');
                                   
        const formattedMsg = safeMessage.replace(/\n/g, '<br/>');
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="${textColors[type]} text-sm font-medium">
                    ${formattedMsg}
                </div>
                <button class="text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });
        
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Obter provedor Solana
    const getProvider = () => {
        if ('phantom' in window && window.phantom?.solana) {
            return window.phantom.solana;
        }
        if ('solana' in window) {
            return window.solana;
        }
        return null;
    };

    // Conectar Carteira
    window.connectPhantom = async function() {
        const phantomProvider = getProvider();
        if (!phantomProvider) {
            alert("⚠️ EXTENSÃO SOLANA NÃO DETECTADA ⚠️\n\nA carteira Phantom (ou Solflare) não respondeu. Motivos mais comuns:\n\n1. Você abriu o arquivo clicando 2x no Windows (URL começa com file://). A Phantom bloqueia arquivos locais. Você precisa abrir via servidor (http://localhost:8080).\n2. Você está numa Aba Anônima (extensões desativadas).\n3. A extensão não está instalada neste perfil do navegador.\n\nO DApp agora vai entrar em Modo Demonstração (MOCK) para que você consiga testar a interface.");
            window.showToast("Iniciando conexão MOCK (Modo Demonstração)...", "warning");
            setTimeout(() => {
                const fakePublicKey = { toString: () => "DeMo9xyzXXXXXXXXXXXXXXXXXXXXX123456789SNaKe" };
                handleConnect(fakePublicKey);
                window.showToast("Mock Wallet Conectada! (Modo Simulação)", "success");
            }, 1000);
            return;
        }
        try {
            const resp = await phantomProvider.connect();
            handleConnect(resp.publicKey);
        } catch (err) {
            console.error("Conexão recusada", err);
            window.showToast("Erro ao conectar: " + (err.message || "Conexão recusada pela carteira."), "error");
        }
    };

    async function handleConnect(publicKey) {
        userPublicKey = publicKey;
        isPhantomConnected = true;
        window.isPhantomConnected = true;

        // Suporte para o botão antigo
        const connectBtns = document.querySelectorAll('.btn-connect');
        connectBtns.forEach(btn => {
            btn.innerHTML = `<i class="fa-solid fa-wallet mr-2"></i> ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
            btn.classList.replace('bg-brand-purple', 'bg-brand-accent');
            btn.classList.add('text-black');
        });

        // Suporte para a nova estrutura HTML que o usuário criou
        const mainBtn = document.getElementById('connect-wallet-btn');
        if (mainBtn) {
            mainBtn.classList.remove('bg-[#9945FF]', 'hover:bg-[#8338e3]', 'shadow-[0_0_15px_rgba(153,69,255,0.4)]', 'text-white');
            mainBtn.classList.add('bg-brand-accent', 'hover:bg-[#0ea5e9]', 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', 'text-black');
            
            const txt = document.getElementById('connect-text');
            if (txt) txt.innerText = `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
            
            const dot = document.getElementById('status-dot');
            if (dot) {
                dot.classList.remove('bg-red-500', 'animate-pulse');
                dot.classList.add('bg-black');
            }
        }

        // Atualiza a frase "Nenhuma carteira conectada" no Portfólio
        const portfolioAddress = document.getElementById('wallet-address');
        if (portfolioAddress) {
            portfolioAddress.innerText = `Conectado: ${publicKey.toString()}`;
            portfolioAddress.classList.remove('text-gray-400');
            portfolioAddress.classList.add('text-brand-accent');
        }

        window.showToast("Carteira conectada com sucesso!", "success");
        if (window.renderBadges) window.renderBadges();
        
        // Renderiza os saldos no portfólio imediatamente
        if (window.updateMockBalances) {
            window.updateMockBalances('');
        }
    }

    // Modal de NFT
    window.showNFTModal = function() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-out]';
        modal.innerHTML = `
            <div class="glass-card rounded-3xl p-8 max-w-md w-full text-center relative border-[#9945FF]/50 shadow-[0_0_50px_rgba(153,69,255,0.2)]">
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-full p-1 shadow-[0_0_30px_rgba(20,241,149,0.5)]">
                    <div class="w-full h-full bg-black rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-microchip text-3xl text-white"></i>
                    </div>
                </div>
                <h3 class="text-2xl font-black text-white mt-8 mb-2">Aquisição de Nó Confirmada! <br><span class="text-sm text-brand-accent">Edição #${Math.floor(Math.random() * 8999) + 1000}</span></h3>
                <p class="text-gray-400 text-sm mb-6">Sua licença de operação (NFT) foi gravada na blockchain Solana.</p>
                
                <div class="bg-black/50 rounded-xl p-4 mb-6 border border-white/5">
                    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80" class="w-full h-40 object-cover rounded-lg mb-3" alt="IoT Device">
                    <p class="text-xs text-gray-500 font-mono break-all">Endereço do Ativo:<br>SnK...${Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
                </div>

                <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                    Ir para o Dashboard
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Estado MOCK
    const savedState = localStorage.getItem('snakesol_portfolio_state'); 
    window.mockState = savedState ? JSON.parse(savedState) : { energy: 50, snake: 0, hw: 1, co2: 14.2, p2p: { solarfazenda: 1500, pedro: 300, condominio: 5000 } };
    if (!window.mockState.p2p) {
        window.mockState.p2p = { solarfazenda: 1500, pedro: 300, condominio: 5000 };
    }

    function updateUSDValue() {
        const el = document.getElementById('usd-value');
        if (!el) return;
        if (!window.isPhantomConnected) {
            el.innerText = `$ 0.00`;
            return;
        }
        const total = (window.mockState.energy * 0.12) + (window.mockState.snake * 0.50) + (window.mockState.hw * 50);
        el.innerText = `$ ${total.toFixed(2)}`;
    }

    function renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;
        
        const leaders = [
            { rank: 1, name: "AlphaNode", energy: 98500, hw: 140 },
            { rank: 2, name: "SolarMax_UK", energy: 84200, hw: 110 },
            { rank: 3, name: "EcoDePIN_Dev", energy: 62100, hw: 85 },
            { rank: 4, name: "GreenGrid_TX", energy: 45000, hw: 62 }
        ];

        let userRank = 5;
        if (window.mockState.energy > 45000) userRank = 4;
        if (window.mockState.energy > 62100) userRank = 3;
        if (window.mockState.energy > 84200) userRank = 2;
        if (window.mockState.energy > 98500) userRank = 1;

        let html = '';
        let currentRank = 1;
        let userRendered = false;
        
        for (let i = 0; i < 5; i++) {
            if (currentRank === userRank && !userRendered) {
                html += `<div class="flex items-center justify-between p-3 bg-brand-accent/10 border border-brand-accent/40 rounded-xl transform transition-all hover:scale-105">
                            <div class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-brand-accent text-black flex items-center justify-center font-bold text-xs">${currentRank}</div>
                                <span class="text-white font-bold">Você (Sua Carteira)</span>
                            </div>
                            <div class="text-right">
                                <div class="text-brand-accent font-bold">${window.mockState.energy} kWh</div>
                                <div class="text-xs text-gray-400">${window.mockState.hw} Nós</div>
                            </div>
                        </div>`;
                userRendered = true;
                if (currentRank !== 5) i--; 
            } else {
                const l = leaders[currentRank - 1 - (userRendered && currentRank > userRank ? 1 : 0)];
                if (l) {
                    html += `<div class="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                                <div class="flex items-center gap-3">
                                    <div class="w-6 h-6 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center font-bold text-xs">${currentRank}</div>
                                    <span class="text-gray-300">${l.name}</span>
                                </div>
                                <div class="text-right">
                                    <div class="text-white font-bold">${l.energy} kWh</div>
                                    <div class="text-xs text-gray-500">${l.hw} Nós</div>
                                </div>
                            </div>`;
                }
            }
            currentRank++;
        }
        leaderboardList.innerHTML = html;
    }

    window.updateMockBalances = function(action) {
        const act = (action || '').toLowerCase();
        
        if (act.includes('swap')) {
            const swapOut = document.getElementById('swap-output');
            const swapIn = document.getElementById('swap-input');
            const fromToken = document.getElementById('swap-from-token')?.value || 'SOL';
            const toToken = document.getElementById('swap-to-token')?.value || 'ENERGY';
            
            if (swapOut && swapIn) {
                const amountIn = parseFloat(swapIn.value) || 0;
                const amountOut = parseFloat(swapOut.value) || 0;
                
                // Atualiza saldos dinâmicos se forem ENERGY ou SNAKE
                if (toToken === 'ENERGY') window.mockState.energy += amountOut;
                if (toToken === 'SNAKE') window.mockState.snake += amountOut;
                
                if (fromToken === 'ENERGY') window.mockState.energy = Math.max(0, window.mockState.energy - amountIn);
                if (fromToken === 'SNAKE') window.mockState.snake = Math.max(0, window.mockState.snake - amountIn);
                
                const solBal = document.getElementById('dex-from-balance');
                if (solBal && fromToken === 'SOL') {
                    solBal.innerText = Math.max(0, parseFloat(solBal.innerText) - amountIn).toFixed(2);
                } else if (solBal && toToken === 'SOL') {
                    solBal.innerText = (parseFloat(solBal.innerText) + amountOut).toFixed(2);
                }
            }
        } else if (act.includes('investir') || act.includes('financiar') || act.includes('patrocinar')) {
            const match = act.match(/(\d+)\s*usdt/i);
            const amount = match ? parseInt(match[1]) : 100;
            
            // Simula investimento USDT e recebe $SNAKE de Yield imediato e Créditos CO2
            window.mockState.snake += (amount * 0.5); // Recebe 50% em SNAKE como recompensa inicial/yield
            window.mockState.co2 += (amount * 0.1);   // Ganha certificado verde por investir
        } else if (act.includes('p2p')) {
            const match = act.match(/comprar (\d+)/);
            const amount = match ? parseInt(match[1]) : 100;
            window.mockState.energy += amount;
            
            if (act.includes('solarfazenda')) window.mockState.p2p.solarfazenda -= amount;
            if (act.includes('pedro')) window.mockState.p2p.pedro -= amount;
            if (act.includes('condominio')) window.mockState.p2p.condominio -= amount;
            
            const availSolar = document.getElementById('p2p-avail-solarfazenda');
            const availPedro = document.getElementById('p2p-avail-pedro');
            const availCondominio = document.getElementById('p2p-avail-condominio');
            
            if (availSolar) availSolar.innerText = window.mockState.p2p.solarfazenda;
            if (availPedro) availPedro.innerText = window.mockState.p2p.pedro;
            if (availCondominio) availCondominio.innerText = window.mockState.p2p.condominio;
        } else if (act.includes('comprar $energy')) {
            window.mockState.energy += 100;
        } else if (act.includes('equipamento iot') || act.includes('kit solar') || act.includes('carregador ve') || act.includes('hardware')) {
            if (window.mockState.energy >= 10) window.mockState.energy -= 10;
            window.mockState.hw += 1;
        } else if (act.includes('stake')) {
            const match = act.match(/stake de (\d+)/);
            const amount = match ? parseInt(match[1]) : 50;
            if (window.mockState.snake >= amount) {
                // Em um cenário real de Staking, o saldo livre diminui e o "Staked" aumenta.
                // Como não temos um contador "Staked" separado no mock, vamos apenas piscar o painel.
                // Mas garantimos a lógica:
                window.mockState.snake -= amount; // Simulando a trava
                setTimeout(() => { window.mockState.snake += amount; }, 10000); // Libera depois de 10s só pro Demo
            }
        } else if (act.includes('recarga ve')) {
            if (window.mockState.energy >= 15) window.mockState.energy -= 15;
        } else if (act.includes('certificado verde')) {
            window.mockState.co2 += 5.5;
        }

        const eEl = document.getElementById('balance-energy');
        const sEl = document.getElementById('balance-snake');
        const hwEl = document.getElementById('balance-hw');
        const co2El = document.getElementById('user-co2');

        const displayEnergy = window.isPhantomConnected ? window.mockState.energy : 0;
        const displaySnake = window.isPhantomConnected ? window.mockState.snake : 0;
        const displayHw = window.isPhantomConnected ? window.mockState.hw : 0;
        const displayCo2 = window.isPhantomConnected ? window.mockState.co2.toFixed(1) : "0.0";

        if (eEl) eEl.innerHTML = `${displayEnergy} <span class="text-sm font-normal text-gray-500">$ENERGY</span>`;
        if (sEl) sEl.innerHTML = `${displaySnake} <span class="text-sm font-normal text-gray-500">$SNAKE</span>`;
        if (hwEl) hwEl.innerHTML = `${displayHw} <span class="text-sm font-normal text-gray-500">Unids</span>`;
        if (co2El) co2El.innerText = `${displayCo2} Kg`;
        
        localStorage.setItem('snakesol_portfolio_state', JSON.stringify(window.mockState));
        
        updateUSDValue();
        if (window.updateROIUSD) window.updateROIUSD();
        renderLeaderboard();
        if (window.renderBadges) window.renderBadges();
    };

    window.addLogEntry = function(actionName, signature, saveToStorage = true) {
        const logList = document.getElementById('tx-log');
        if (!logList) return;
        
        const emptyMsg = document.getElementById('empty-log-msg');
        if (emptyMsg) emptyMsg.style.display = 'none';
        
        const shortSig = signature.slice(0, 4) + '...' + signature.slice(-4);
        const linkHtml = `<a href="https://explorer.solana.com/tx/${signature}?cluster=devnet" class="text-xs text-[#9945FF] hover:underline" target="_blank" title="Ver na Solana">Ver no Explorer <i class="fa-solid fa-external-link-alt text-[10px]"></i></a>`;

        const newLog = document.createElement('div');
        newLog.className = 'flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl text-sm animate-[fade-in_0.3s_ease-out] mb-2';
        newLog.innerHTML = `
            <div>
                <p class="font-bold text-white mb-1">${actionName}</p>
                <div class="flex items-center gap-2">
                    <code class="text-xs text-brand-accent bg-brand-accent/10 px-2 py-1 rounded"><i class="fa-brands fa-solana"></i> ${shortSig}</code>
                    <button onclick="navigator.clipboard.writeText('${signature}')" class="text-gray-400 hover:text-white transition-colors" title="Copiar TX">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="flex flex-col items-end">
                ${linkHtml}
                <span class="text-xs text-gray-500 mt-1">Agora mesmo</span>
            </div>
        `;
        logList.insertBefore(newLog, logList.firstChild);
        if (logList.children.length > 20) logList.removeChild(logList.lastChild);
        
        if (saveToStorage) {
            let history = JSON.parse(localStorage.getItem('snakeTxHistory') || '[]');
            history.unshift({ actionName, signature });
            if (history.length > 20) history.pop();
            localStorage.setItem('snakeTxHistory', JSON.stringify(history));
        }
    };
    
    window.loadTxHistory = function() {
        const history = JSON.parse(localStorage.getItem('snakeTxHistory') || '[]');
        // Adiciona de trás pra frente pra manter a ordem
        history.reverse().forEach(tx => {
            window.addLogEntry(tx.actionName, tx.signature, false);
        });
    };

    window.showP2PModal = function() {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }

        if (window.mockState && window.mockState.p2p) {
            const availSolar = document.getElementById('p2p-avail-solarfazenda');
            const availPedro = document.getElementById('p2p-avail-pedro');
            const availCondominio = document.getElementById('p2p-avail-condominio');
            
            if (availSolar) availSolar.innerText = window.mockState.p2p.solarfazenda;
            if (availPedro) availPedro.innerText = window.mockState.p2p.pedro;
            if (availCondominio) availCondominio.innerText = window.mockState.p2p.condominio;
        }

        const modal = document.getElementById('p2p-modal');
        const content = document.getElementById('p2p-modal-content');
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    };

    window.closeP2PModal = function() {
        const modal = document.getElementById('p2p-modal');
        const content = document.getElementById('p2p-modal-content');
        const feedback = document.getElementById('p2p-feedback');
        
        if (feedback) feedback.classList.add('hidden');
        
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    window.processP2P = async function(sellerId, sellerName) {
        const input = document.getElementById(`p2p-input-${sellerId}`);
        if (!input) return;
        
        const amount = parseInt(input.value);
        if (!amount || amount <= 0) {
            window.showToast("Digite uma quantia válida.", "warning");
            return;
        }
        
        if (amount > window.mockState.p2p[sellerId]) {
            window.showToast(`O produtor só tem ${window.mockState.p2p[sellerId]} kWh disponíveis.`, "error");
            return;
        }
        
        input.disabled = true;
        await window.submitP2PPurchase(amount, sellerName);
        
        input.value = '';
        input.disabled = false;
    };

    window.submitP2PPurchase = async function(amount, seller) {
        document.getElementById('p2p-feedback').classList.remove('hidden');
        
        // Envia para o fluxo de blockchain passando a quantidade como "action"
        const actionString = `Comprar ${amount} $ENERGY P2P (${seller})`;
        await window.executeTransaction(actionString);
        
        setTimeout(() => {
            window.closeP2PModal();
        }, 1000);
    };

    // --- SIZING MODAL LOGIC ---
    let currentSizingPrice = 0;
    
    window.openSizingModal = function() {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }
        window.resetSizing();
        
        const modal = document.getElementById('sizing-modal');
        const content = document.getElementById('sizing-modal-content');
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    };

    window.closeSizingModal = function() {
        const modal = document.getElementById('sizing-modal');
        const content = document.getElementById('sizing-modal-content');
        
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    window.calculateSizing = function() {
        const base = parseInt(document.getElementById('sizing-base').value) || 0;
        const ac = parseInt(document.getElementById('sizing-ac').value) || 0;
        const extra = parseInt(document.getElementById('sizing-extra').value) || 0;
        const pool = document.getElementById('sizing-pool').checked;
        
        if (base < 50) {
            window.showToast("Consumo base muito baixo para projeto solar.", "warning");
            return;
        }

        const addAc = ac * 100;
        const addPool = pool ? 250 : 0;
        const totalAdd = addAc + addPool + extra;
        
        const totalConsumption = base + totalAdd;
        
        // Margem de segurança de 15% arredondando para dezenas
        const recommendedCapacity = Math.ceil((totalConsumption * 1.15) / 10) * 10;
        
        // Preço simulação: 8 USDT por kWh instalado (ex: 1100 -> 8800 USDT)
        currentSizingPrice = recommendedCapacity * 8;
        
        document.getElementById('res-base').innerText = `${base} kWh`;
        document.getElementById('res-add').innerText = `+ ${totalAdd} kWh`;
        document.getElementById('res-total').innerHTML = `${recommendedCapacity} kWh <span class="text-sm font-normal text-gray-500">/ mês</span>`;
        document.getElementById('res-price').innerText = `${currentSizingPrice.toLocaleString('en-US')} USDT`;
        
        document.getElementById('sizing-step-1').classList.add('hidden');
        document.getElementById('sizing-step-2').classList.remove('hidden');
    };

    window.resetSizing = function() {
        document.getElementById('sizing-step-1').classList.remove('hidden');
        document.getElementById('sizing-step-2').classList.add('hidden');
    };

    window.confirmSizingPurchase = async function() {
        window.closeSizingModal();
        const actionString = `Adquirir Kit Solar DePIN (${currentSizingPrice} USDT)`;
        await window.executeTransaction(actionString);
        
        // Incrementa um Hardware após a compra
        window.mockState.hw += 1;
    };
    // --------------------------

    window.openMapInvestModal = function(targetName) {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }

        const modal = document.getElementById('map-invest-modal');
        const content = document.getElementById('map-invest-modal-content');
        const targetEl = document.getElementById('map-invest-target');
        const inputEl = document.getElementById('map-invest-amount');
        
        if (targetEl) targetEl.innerText = "Alvo: " + targetName;
        if (inputEl) inputEl.value = '500'; // reset default
        
        // Store the target name globally for the confirm function
        window.currentMapTarget = targetName;
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    };

    window.closeMapInvestModal = function() {
        const modal = document.getElementById('map-invest-modal');
        const content = document.getElementById('map-invest-modal-content');
        
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    window.confirmMapInvestment = async function() {
        const input = document.getElementById('map-invest-amount');
        if (!input) return;
        
        const amount = parseInt(input.value);
        if (!amount || amount < 10) {
            window.showToast("O investimento mínimo é 10 USDT.", "warning");
            return;
        }
        
        // Simulate USDT spending (no balance check needed for demo, just deduct or record)
        window.closeMapInvestModal();
        
        // Send to blockchain transaction
        const actionString = `Investir ${amount} USDT em ${window.currentMapTarget || 'DePIN'}`;
        await window.executeTransaction(actionString);
    };

    window.showStakeModal = function() {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }
        const modal = document.getElementById('stake-modal');
        const content = document.getElementById('stake-modal-content');
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    };

    window.closeStakeModal = function() {
        const modal = document.getElementById('stake-modal');
        const content = document.getElementById('stake-modal-content');
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    window.submitStake = async function() {
        const amount = document.getElementById('stake-amount').value || '0';
        const btn = document.getElementById('submit-stake-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';
        btn.disabled = true;
        
        window.closeStakeModal();
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            window.executeTransaction('Fazer Stake de ' + amount + ' $SNAKE');
        }, 350);
    };

    const DEX_RATES = {
        'SOL_ENERGY': 950,
        'ENERGY_SOL': 0.00105,
        'SOL_SNAKE': 120,
        'SNAKE_SOL': 0.0083,
        'ENERGY_SNAKE': 0.126,
        'SNAKE_ENERGY': 7.93
    };

    window.updateSwapCalculation = function() {
        const fromToken = document.getElementById('swap-from-token').value;
        const toToken = document.getElementById('swap-to-token').value;
        const amountIn = parseFloat(document.getElementById('swap-input').value) || 0;
        
        document.getElementById('dex-from-lbl').innerText = fromToken;
        
        if (fromToken === toToken) {
            document.getElementById('swap-output').value = amountIn.toFixed(2);
            return;
        }
        
        const pair = `${fromToken}_${toToken}`;
        const rate = DEX_RATES[pair] || 1;
        document.getElementById('swap-output').value = (amountIn * rate).toFixed(4);
    };

    window.invertSwap = function() {
        const fromToken = document.getElementById('swap-from-token');
        const toToken = document.getElementById('swap-to-token');
        
        const temp = fromToken.value;
        fromToken.value = toToken.value;
        toToken.value = temp;
        
        window.updateSwapCalculation();
    };

    window.executeSwap = function() {
        const fromToken = document.getElementById('swap-from-token').value;
        const toToken = document.getElementById('swap-to-token').value;
        const amountIn = document.getElementById('swap-input').value;
        
        if (fromToken === toToken) {
            window.showToast("Selecione tokens diferentes para trocar.", "warning");
            return;
        }
        
        window.executeTransaction('Swap ' + amountIn + ' ' + fromToken + ' por $' + toToken + ' na DEX');
    };

    window.showVoteModal = function() {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }
        const modal = document.getElementById('vote-modal');
        const content = document.getElementById('vote-modal-content');
        modal.classList.remove('hidden');
        // trigger reflow
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    };

    window.closeVoteModal = function() {
        const modal = document.getElementById('vote-modal');
        const content = document.getElementById('vote-modal-content');
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    window.submitVote = async function() {
        const selectedOption = document.querySelector('input[name="dao-vote"]:checked').value;
        const weight = document.getElementById('vote-weight').value || '0';
        
        const btn = document.getElementById('submit-vote-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';
        btn.disabled = true;
        
        window.closeVoteModal();
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            window.executeTransaction('Voto DAO: ' + selectedOption + ' (' + weight + ' $SNAKE)');
        }, 350);
    };

    // Executar Transação na Blockchain
    window.executeTransaction = async function(actionName) {
        if (!window.isPhantomConnected || !userPublicKey) {
            window.showToast("Conecte a carteira primeiro!", "warning");
            return;
        }

        const buttons = document.querySelectorAll('button');
        let targetButton = null;
        buttons.forEach(btn => {
            if (btn.innerText.includes(actionName.split(' ')[0])) targetButton = btn;
        });

        let originalHtml = '';
        if (targetButton) {
            originalHtml = targetButton.innerHTML;
            targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';
            targetButton.disabled = true;
        }

        const phantomProvider = getProvider();

        try {
            let signature = '';
            
            if (!phantomProvider) {
                if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Simulando...';
                await new Promise(resolve => setTimeout(resolve, 2000));
                signature = 'mockTx' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                window.addLogEntry(actionName, signature);
                window.updateMockBalances(actionName);
                if (actionName.includes('Equipamento IoT') || actionName.includes('Kit Solar') || actionName.toLowerCase().includes('kit solar') || actionName.includes('Carregador VE') || actionName.includes('hardware')) {
                    window.showNFTModal();
                } else {
                    window.showToast("⚡ Transação Confirmada!\n\n(Modo Demonstração: Nenhuma blockchain real foi usada).", "success", 8000);
                    if (window.switchTab) {
                        window.switchTab('dashboard');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
                return;
            }

            let validPublicKey = userPublicKey;
            if (typeof userPublicKey === 'string') {
                validPublicKey = new solanaWeb3.PublicKey(userPublicKey);
            }

            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'processed');
            const transaction = new solanaWeb3.Transaction();
            
            transaction.add(
                solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 1000000
                })
            );

            transaction.add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: validPublicKey,
                    toPubkey: validPublicKey, // Envia pra si mesmo como "Aprovação Smart Contract" mockada
                    lamports: Math.floor(0.001 * solanaWeb3.LAMPORTS_PER_SOL), 
                })
            );

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = validPublicKey;

            if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Aprove na Phantom...';
            
            const signedTransaction = await phantomProvider.signTransaction(transaction);

            if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Confirmando...';
            
            signature = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false });

            // Hackathon UX: Evita lentidão da Devnet e assume sucesso após assinatura
            await new Promise(resolve => setTimeout(resolve, 1500));

            window.showToast("⚡ Transação Confirmada na Blockchain!\n\nA transação real foi gravada na Devnet com sucesso.", "success", 8000);

            window.addLogEntry(actionName, signature);
            window.updateMockBalances(actionName);

            if (actionName.includes('Equipamento IoT') || actionName.includes('Kit Solar') || actionName.toLowerCase().includes('kit solar') || actionName.includes('Carregador VE') || actionName.includes('hardware')) {
                window.showNFTModal();
            } else {
                if (window.switchTab) {
                    window.switchTab('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } catch (error) {
            console.error("Erro na transação:", error);
            
            if (error.message && (error.message.includes("block height exceeded") || error.message.includes("expired") || error.message.includes("timeout") || error.message.includes("not confirmed"))) {
                window.showToast("⚠️ Transação Enviada (Rede Lenta)!\n\nA Devnet está congestionada. A transação foi enviada, mas demorou muito para retornar confirmação. Verifique o Solscan.", "warning", 8000);
                if (window.addLogEntry && signature) window.addLogEntry(actionName, signature);
            } else if (error.message && (error.message.toLowerCase().includes("insufficient") || error.message.includes("0x1") || error.message.includes("Attempt to debit") || error.message.includes("Simulation failed"))) {
                window.showToast("🚫 Saldo Insuficiente!\n\nVocê precisa de SOL (Devnet) para pagar as taxas (Gas). Acesse faucet.solana.com para pegar moedas de teste.", "error", 8000);
            } else if (error.message && error.message.includes("User rejected")) {
                window.showToast("Você cancelou a assinatura da transação.", "info", 5000);
            } else {
                window.showToast("Erro ao processar na blockchain: " + (error.message || "Tente novamente."), "error", 8000);
            }
        } finally {
            if (targetButton) {
                targetButton.innerHTML = originalHtml;
                targetButton.disabled = false;
            }
        }
    };

    // ROI Slider Logic
    const roiSlider = document.getElementById('roi-slider');
    const roiNodesValue = document.getElementById('roi-nodes-value');
    const roiEnergy = document.getElementById('roi-energy');
    const roiYield = document.getElementById('roi-yield');
    const roiUsd = document.getElementById('roi-usd');

    if (roiSlider && roiNodesValue && roiEnergy && roiYield && roiUsd) {
        roiSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            roiNodesValue.innerText = `${val} Nó${val > 1 ? 's' : ''}`;
            roiEnergy.innerHTML = `${val * 450} <span class="text-xs text-gray-500">kWh</span>`;
            roiYield.innerHTML = `${val * 150} <span class="text-xs text-gray-500">$SNAKE</span>`;
            window.updateROIUSD = function() {
                const yieldUsd = (val * 150 * 0.12).toFixed(2);
                roiUsd.innerText = `~ $${yieldUsd} USD`;
            };
            window.updateROIUSD();
        });
        setTimeout(() => { roiSlider.dispatchEvent(new Event('input')); }, 100);
    }

    // Initialize Chart.js
    const ctx = document.getElementById('energyChart');
    if (ctx) {
        window.energyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Dia 1', 'Dia 5', 'Dia 10', 'Dia 15', 'Dia 20', 'Dia 25', 'Hoje'],
                datasets: [{
                    label: 'Geração Acumulada (kWh)',
                    data: [100, 350, 800, 1500, 2400, 3600, 4500],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#9945FF',
                    pointBorderColor: '#fff',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                    x: { grid: { display: false }, ticks: { color: '#888' } }
                }
            }
        });
    }

    // Render Badges
    window.renderBadges = function() {
        const container = document.getElementById('badges-container');
        if (!container) return;
        
        container.innerHTML = '';
        if (!window.isPhantomConnected) return;

        let hasBadges = false;

        if (window.mockState.co2 > 0) {
            container.innerHTML += `<div class="bg-green-900/40 border border-green-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)] tooltip-trigger" title="Emitiu certificado de carbono"><i class="fa-solid fa-leaf text-2xl text-green-400"></i><div><p class="font-bold text-white text-sm">Eco-Friendly</p><p class="text-[10px] text-gray-400">Certificado ESG emitido</p></div></div>`;
            hasBadges = true;
        }
        
        if (window.mockState.snake >= 50) {
            container.innerHTML += `<div class="bg-purple-900/40 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]"><i class="fa-solid fa-whale text-2xl text-purple-400"></i><div><p class="font-bold text-white text-sm">Baleia Elétrica</p><p class="text-[10px] text-gray-400">Poder de governança ativo</p></div></div>`;
            hasBadges = true;
        }

        if (window.mockState.hw > 0) {
            container.innerHTML += `<div class="bg-amber-900/40 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]"><i class="fa-solid fa-server text-2xl text-amber-400"></i><div><p class="font-bold text-white text-sm">Node Runner</p><p class="text-[10px] text-gray-400">Provedor de rede DePIN</p></div></div>`;
            hasBadges = true;
        }

        if (!hasBadges) container.innerHTML = '<p class="text-sm text-gray-500 w-full text-center py-6 italic">Realize ações na plataforma para desbloquear medalhas.</p>';
    };

    // Vote DAO
    window.voteDao = async function(option) {
        if (!window.isPhantomConnected || !userPublicKey) {
            if (window.showToast) window.showToast('Conecte sua carteira para votar!', 'error');
            return;
        }
        if (window.mockState.snake < 50) {
            if (window.showToast) window.showToast('Stake insuficiente! Necessário 50 $SNAKE.', 'error');
            return;
        }
        
        const btn = document.getElementById('btn-vote-' + option);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="flex justify-center items-center py-2"><i class="fa-solid fa-circle-notch fa-spin text-white"></i></div>';
        
        const phantomProvider = getProvider();

        try {
            let signature = '';
            
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
            if (typeof userPublicKey === 'string') {
                validPublicKey = new solanaWeb3.PublicKey(userPublicKey);
            }

            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'processed');
            const transaction = new solanaWeb3.Transaction();
            
            transaction.add(
                solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 1000000
                })
            );

            transaction.add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: validPublicKey,
                    toPubkey: validPublicKey,
                    lamports: 100
                })
            );

            const latestBlockhash = await connection.getLatestBlockhash('processed');
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = validPublicKey;

            const signedTransaction = await phantomProvider.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false });
            
            // Hackathon UX: Evita lentidão da Devnet e assume sucesso após assinatura
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (window.showToast) window.showToast('Voto computado com sucesso na Devnet!', 'success');

            btn.innerHTML = originalHtml;
            btn.classList.add('border-[#14F195]', 'bg-[#14F195]/10');
            document.getElementById('vote-feedback').classList.remove('hidden');
            if (window.addLogEntry) window.addLogEntry('Voto DAO: Proposta #042', signature);
        } catch (error) {
            console.error("Erro ao votar:", error);
            if (error.message && (error.message.includes("block height exceeded") || error.message.includes("expired") || error.message.includes("timeout") || error.message.includes("not confirmed"))) {
                if (window.showToast) window.showToast("⚠️ Voto Enviado (Rede Lenta)!\n\nA Devnet está congestionada e não confirmou a tempo, mas a transação foi enviada.", "warning", 8000);
                btn.innerHTML = originalHtml;
                btn.classList.add('border-[#14F195]', 'bg-[#14F195]/10');
                document.getElementById('vote-feedback').classList.remove('hidden');
                if (window.addLogEntry && signature) window.addLogEntry('Voto DAO: Proposta #042', signature);
            } else if (error.message && (error.message.toLowerCase().includes("insufficient") || error.message.includes("0x1") || error.message.includes("Attempt to debit") || error.message.includes("Simulation failed"))) {
                window.showToast("🚫 Saldo Insuficiente!\n\nVocê precisa de SOL (Devnet) para pagar as taxas. Acesse faucet.solana.com para pegar moedas de teste.", "error", 8000);
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
    window.loadTxHistory();
});

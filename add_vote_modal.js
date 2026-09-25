const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Change the button onclick
html = html.replace(/onclick="window\.executeTransaction\('Votar na Governança'\)"/, 'onclick="window.showVoteModal()"');

const voteModalHtml = 
    <!-- Vote Modal -->
    <div id="vote-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
        <div class="relative bg-[#0B0F19] border border-[#9945FF]/40 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(153,69,255,0.2)] transform scale-95 transition-transform duration-300" id="vote-modal-content">
            <button onclick="window.closeVoteModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <i class="fa-solid fa-times text-xl"></i>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full bg-[#9945FF]/20 flex items-center justify-center mx-auto mb-4 border border-[#9945FF]/50">
                    <i class="fa-solid fa-check-to-slot text-3xl text-[#9945FF]"></i>
                </div>
                <h3 class="text-2xl font-black mb-2">Governança DAO</h3>
                <p class="text-sm text-gray-400">Decida onde a SnakeSol Energy deve instalar a próxima Micro Usina Solar. Seu poder de voto é proporcional aos seus tokens  em Stake.</p>
            </div>
            
            <div class="space-y-3 mb-6">
                <label class="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-[#9945FF]/50 bg-white/5 cursor-pointer transition-colors group">
                    <input type="radio" name="dao-vote" value="São Paulo/SP" class="w-4 h-4 text-[#9945FF] focus:ring-[#9945FF] bg-black border-gray-600" checked>
                    <div class="flex-1">
                        <p class="font-bold text-white group-hover:text-[#9945FF] transition-colors">São Paulo - SP</p>
                        <p class="text-xs text-gray-400">Alta demanda industrial</p>
                    </div>
                </label>
                
                <label class="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-[#9945FF]/50 bg-white/5 cursor-pointer transition-colors group">
                    <input type="radio" name="dao-vote" value="Curitiba/PR" class="w-4 h-4 text-[#9945FF] focus:ring-[#9945FF] bg-black border-gray-600">
                    <div class="flex-1">
                        <p class="font-bold text-white group-hover:text-[#9945FF] transition-colors">Curitiba - PR</p>
                        <p class="text-xs text-gray-400">Polo Tecnológico Verde</p>
                    </div>
                </label>
                
                <label class="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-[#9945FF]/50 bg-white/5 cursor-pointer transition-colors group">
                    <input type="radio" name="dao-vote" value="Sertão Nordestino" class="w-4 h-4 text-[#9945FF] focus:ring-[#9945FF] bg-black border-gray-600">
                    <div class="flex-1">
                        <p class="font-bold text-white group-hover:text-[#9945FF] transition-colors">Sertão Nordestino</p>
                        <p class="text-xs text-gray-400">Máxima Insolação (Maior ROI)</p>
                    </div>
                </label>
            </div>
            
            <div class="mb-6">
                <p class="text-xs text-gray-400 mb-2">Peso do Voto (Alocação de ):</p>
                <div class="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between focus-within:border-[#9945FF]/50 transition-colors">
                    <input type="number" id="vote-weight" value="50" class="bg-transparent text-xl font-bold w-1/2 outline-none text-white" step="1" min="1">
                    <span class="text-sm font-bold text-[#9945FF]"></span>
                </div>
            </div>

            <button onclick="window.submitVote()" id="submit-vote-btn" class="w-full bg-gradient-to-r from-[#9945FF] to-[#7928CA] text-white py-4 rounded-xl font-black text-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(153,69,255,0.4)]">
                Assinar Voto na Blockchain
            </button>
        </div>
    </div>
    <!-- Fim Modal Vote -->
;

// Insert the modal before the closing </body> tag or right after the nft-modal
html = html.replace(/(<!-- NFT Mint Modal \(Invisível por padrão\) -->[\s\S]*?<\/div>\s*<\/div>)/, "\n" + voteModalHtml);

fs.writeFileSync('index.html', html, 'utf8');

// Now add the logic to app.js
let js = fs.readFileSync('app.js', 'utf8');

const modalLogic = 
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
        
        window.closeVoteModal();
        
        // Use a timeout to wait for modal close animation before prompting wallet
        setTimeout(() => {
            window.executeTransaction('Voto DAO: ' + selectedOption + ' (' + weight + ' )');
        }, 350);
    };
;

js = js.replace(/window\.executeTransaction = async function/, modalLogic + '\n    window.executeTransaction = async function');

fs.writeFileSync('app.js', js, 'utf8');

console.log("Success!");

(function secureApp() {
  'use strict';
  window.Buffer = window.Buffer || (window.buffer && window.buffer.Buffer);

  // ============================================================================
  // SECURITY MODULE: Input Validation
  // ============================================================================
  const SecurityValidation = {
    sanitizeText(value) {
      if (typeof value !== 'string') return String(value ?? '');
      return value.replace(/[<>"'&]/g, (char) => {
        const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return map[char] || char;
      });
    },

    validateAmount(value, min = 0, max = 1000000) {
      const num = Number.parseInt(value, 10);
      if (!Number.isInteger(num)) throw new Error(`Valor deve ser um número inteiro`);
      if (num < min || num > max) throw new Error(`Valor deve estar entre ${min} e ${max}`);
      return num;
    },

    validateDecimal(value, min = 0, max = 1000000) {
      const num = Number.parseFloat(value);
      if (!Number.isFinite(num)) throw new Error(`Valor inválido`);
      if (num < min || num > max) throw new Error(`Valor deve estar entre ${min} e ${max}`);
      return num;
    },

    validateEmail(value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value)) throw new Error('Email inválido');
      return value.trim();
    },

    validatePhone(value) {
      const re = /^[\d\s\-\+\(\)]+$/;
      if (value.length < 10 || !re.test(value)) throw new Error('Telefone inválido');
      return value.trim();
    }
  };

  // ============================================================================
  // SECURITY MODULE: Session Storage (NOT localStorage)
  // ============================================================================
  const SecureStorage = {
    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn('SessionStorage unavailable, using memory fallback');
      }
    },

    get(key, defaultValue) {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
      } catch (err) {
        return defaultValue;
      }
    },

    remove(key) {
      try {
        sessionStorage.removeItem(key);
      } catch (err) {
        console.warn('Cannot remove from sessionStorage');
      }
    }
  };

  // ============================================================================
  // SECURITY MODULE: Rate Limiting
  // ============================================================================
  const RateLimiter = {
    transactionInProgress: false,
    lastTransactionTime: 0,
    minDelayMs: 1000,

    canExecute() {
      if (this.transactionInProgress) return false;
      const now = Date.now();
      if (now - this.lastTransactionTime < this.minDelayMs) return false;
      return true;
    },

    markExecuting() {
      this.transactionInProgress = true;
      this.lastTransactionTime = Date.now();
    },

    markComplete() {
      this.transactionInProgress = false;
    }
  };

  // ============================================================================
  // SECURITY MODULE: Safe DOM Manipulation
  // ============================================================================
  const SafeDOM = {
    setText(elementId, text) {
      const el = document.getElementById(elementId);
      if (el) el.textContent = String(text ?? '');
    },

    setHTML(elementId, html) {
      const el = document.getElementById(elementId);
      if (el) el.innerHTML = html;
    },

    createTextElement(tag, text, className = '') {
      const el = document.createElement(tag);
      el.className = className;
      el.textContent = String(text ?? '');
      return el;
    },

    createToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      const bgColors = {
        success: 'bg-[#14F195]/10 border-green-500/50',
        error: 'bg-[#FF3B30]/10 border-red-500/50',
        info: 'bg-[#111c2a] border-blue-500/50',
        warning: 'bg-[#F59E0B]/10 border-yellow-500/50'
      };
      const textColors = {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400',
        warning: 'text-yellow-400'
      };

      toast.className = `${bgColors[type] || bgColors.success} border rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto`;
      toast.setAttribute('role', 'status');

      const row = document.createElement('div');
      row.className = 'flex items-start gap-3';

      const messageNode = document.createElement('div');
      messageNode.className = `${textColors[type] || textColors.success} text-sm font-medium whitespace-pre-line`;
      messageNode.textContent = String(message ?? '');

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'text-gray-400 hover:text-white';
      closeBtn.setAttribute('aria-label', 'Fechar notificação');
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.addEventListener('click', () => toast.remove());

      row.appendChild(messageNode);
      row.appendChild(closeBtn);
      toast.appendChild(row);
      container.appendChild(toast);

      requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
      setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }
  };

  // ============================================================================
  // APP INITIALIZATION
  // ============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    let isPhantomConnected = false;
    let userPublicKey = null;

    // Initialize mock state from sessionStorage (not localStorage!)
    const defaultState = { energy: 50, snake: 0, hw: 1, co2: 14.2, p2p: { solarfazenda: 1500, pedro: 300, condominio: 5000 } };
    window.mockState = SecureStorage.get('snakesol_portfolio_state', defaultState);
    if (!window.mockState.p2p) window.mockState.p2p = { ...defaultState.p2p };

    window.isPhantomConnected = false;
    window.showToast = SafeDOM.createToast;

    window.switchTab = function(tabId) {
      const tabs = document.querySelectorAll('.tab-content');
      tabs.forEach((tab) => {
        tab.classList.remove('block');
        tab.classList.add('hidden');
      });

      const target = document.getElementById('tab-' + tabId);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
      }

      if (tabId === 'map') {
        setTimeout(() => {
          if (window.map && typeof window.map.invalidateSize === 'function') {
            window.map.invalidateSize();
          }
        }, 100);
      }

      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach((item) => {
        item.classList.remove('active', 'text-[#14F195]');
        item.classList.add('text-gray-400');
      });

      const activeNav = document.getElementById('nav-' + tabId);
      if (activeNav) {
        activeNav.classList.add('active');
        activeNav.classList.remove('text-gray-400');
        activeNav.classList.add('text-[#14F195]');
      }

      const mobNavItems = document.querySelectorAll('.nav-mobile-item');
      mobNavItems.forEach((item) => {
        item.classList.remove('text-[#14F195]');
        item.classList.add('text-gray-400');
      });

      const activeMobNav = document.getElementById('mob-nav-' + tabId);
      if (activeMobNav) {
        activeMobNav.classList.remove('text-gray-400');
        activeMobNav.classList.add('text-[#14F195]');
      }
    };

    function bindClick(id, handler) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    }

    // ========================================================================
    // WALLET CONNECTION
    // ========================================================================
    const getProvider = () => {
      if (window.phantom && window.phantom.solana) return window.phantom.solana;
      if (window.solana) return window.solana;
      return null;
    };

    window.connectPhantom = async function() {
      const phantomProvider = getProvider();
      if (!phantomProvider) {
        SafeDOM.createToast('Iniciando conexão MOCK (Modo Demonstração)...', 'warning');
        setTimeout(() => {
          const fakePublicKey = { toString: () => 'DeMo9xyzXXXXXXXXXXXXXXXXXXXXX123456789SNaKe' };
          handleConnect(fakePublicKey);
          SafeDOM.createToast('Mock Wallet Conectada! (Modo Simulação)', 'success');
        }, 1000);
        return;
      }

      try {
        const resp = await phantomProvider.connect();
        handleConnect(resp.publicKey);
      } catch (error) {
        const safeMsg = error?.message || 'Conexão recusada pela carteira.';
        SafeDOM.createToast('Erro ao conectar: ' + safeMsg, 'error');
      }
    };

    async function handleConnect(publicKey) {
      userPublicKey = publicKey;
      isPhantomConnected = true;
      window.isPhantomConnected = true;

      const pubKeyStr = SecurityValidation.sanitizeText(publicKey.toString());
      const shortKey = pubKeyStr.slice(0, 4) + '...' + pubKeyStr.slice(-4);

      const connectBtns = document.querySelectorAll('.btn-connect');
      connectBtns.forEach((btn) => {
        btn.textContent = '💼 ' + shortKey;
        btn.classList.replace('bg-brand-purple', 'bg-brand-accent');
        btn.classList.add('text-black');
      });

      const mainBtn = document.getElementById('connect-wallet-btn');
      if (mainBtn) {
        mainBtn.classList.remove('bg-[#9945FF]', 'hover:bg-[#8338e3]', 'shadow-[0_0_15px_rgba(153,69,255,0.4)]', 'text-white');
        mainBtn.classList.add('bg-brand-accent', 'hover:bg-[#0ea5e9]', 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', 'text-black');
        SafeDOM.setText('connect-text', shortKey);
        const dot = document.getElementById('status-dot');
        if (dot) {
          dot.classList.remove('bg-red-500', 'animate-pulse');
          dot.classList.add('bg-black');
        }
      }

      const portfolioAddress = document.getElementById('wallet-address');
      if (portfolioAddress) {
        SafeDOM.setText('wallet-address', 'Conectado: ' + pubKeyStr);
        portfolioAddress.classList.remove('text-gray-400');
        portfolioAddress.classList.add('text-brand-accent');
      }

      SafeDOM.createToast('Carteira conectada com sucesso!', 'success');
      if (window.renderBadges) window.renderBadges();
      if (window.updateMockBalances) window.updateMockBalances('');
    }

    // ========================================================================
    // BALANCE UPDATES
    // ========================================================================
    function updateUSDValue() {
      const el = document.getElementById('usd-value');
      if (!el) return;
      if (!window.isPhantomConnected) {
        SafeDOM.setText('usd-value', '$ 0.00');
        return;
      }
      const total = (window.mockState.energy * 0.12) + (window.mockState.snake * 0.50) + (window.mockState.hw * 50);
      SafeDOM.setText('usd-value', '$ ' + total.toFixed(2));
    }

    window.updateMockBalances = function(action) {
      const act = (action || '').toLowerCase();

      if (act.includes('swap')) {
        try {
          const swapOut = document.getElementById('swap-output');
          const swapIn = document.getElementById('swap-input');
          const fromToken = document.getElementById('swap-from-token')?.value || 'SOL';
          const toToken = document.getElementById('swap-to-token')?.value || 'ENERGY';

          if (swapOut && swapIn) {
            const amountIn = SecurityValidation.validateDecimal(swapIn.value, 0, 100000);
            const amountOut = SecurityValidation.validateDecimal(swapOut.value, 0, 100000);

            if (toToken === 'ENERGY') window.mockState.energy += amountOut;
            if (toToken === 'SNAKE') window.mockState.snake += amountOut;
            if (fromToken === 'ENERGY') window.mockState.energy = Math.max(0, window.mockState.energy - amountIn);
            if (fromToken === 'SNAKE') window.mockState.snake = Math.max(0, window.mockState.snake - amountIn);
          }
        } catch (err) {
          SafeDOM.createToast('Valores de swap inválidos', 'error');
          return;
        }
      } else if (act.includes('investir') || act.includes('financiar') || act.includes('patrocinar')) {
        const match = act.match(/(\d+)\s*usdt/i);
        const amount = match ? SecurityValidation.validateAmount(match[1], 1, 1000000) : 100;
        window.mockState.snake += amount * 0.5;
        window.mockState.co2 += amount * 0.1;
      } else if (act.includes('p2p')) {
        const match = act.match(/comprar (\d+)/);
        const amount = match ? SecurityValidation.validateAmount(match[1], 1, 100000) : 100;
        window.mockState.energy += amount;

        if (act.includes('solarfazenda')) window.mockState.p2p.solarfazenda = Math.max(0, window.mockState.p2p.solarfazenda - amount);
        if (act.includes('pedro')) window.mockState.p2p.pedro = Math.max(0, window.mockState.p2p.pedro - amount);
        if (act.includes('condominio')) window.mockState.p2p.condominio = Math.max(0, window.mockState.p2p.condominio - amount);

        SafeDOM.setText('p2p-avail-solarfazenda', String(window.mockState.p2p.solarfazenda));
        SafeDOM.setText('p2p-avail-pedro', String(window.mockState.p2p.pedro));
        SafeDOM.setText('p2p-avail-condominio', String(window.mockState.p2p.condominio));
      } else if (act.includes('comprar $energy')) {
        window.mockState.energy += 100;
      } else if (act.includes('equipamento iot') || act.includes('kit solar') || act.includes('carregador ve') || act.includes('hardware')) {
        if (window.mockState.energy >= 10) window.mockState.energy -= 10;
        window.mockState.hw += 1;
      } else if (act.includes('stake')) {
        const match = act.match(/stake de (\d+)/);
        const amount = match ? SecurityValidation.validateAmount(match[1], 1, 1000000) : 50;
        if (window.mockState.snake >= amount) {
          window.mockState.snake -= amount;
          setTimeout(() => { window.mockState.snake += amount; }, 10000);
        }
      } else if (act.includes('recarga ve')) {
        if (window.mockState.energy >= 15) window.mockState.energy -= 15;
      } else if (act.includes('certificado verde')) {
        window.mockState.co2 += 5.5;
      }

      const displayEnergy = window.isPhantomConnected ? window.mockState.energy : 0;
      const displaySnake = window.isPhantomConnected ? window.mockState.snake : 0;
      const displayHw = window.isPhantomConnected ? window.mockState.hw : 0;
      const displayCo2 = window.isPhantomConnected ? window.mockState.co2.toFixed(1) : '0.0';

      SafeDOM.setHTML('balance-energy', displayEnergy + ' <span class="text-sm font-normal text-gray-500">$ENERGY</span>');
      SafeDOM.setHTML('balance-snake', displaySnake + ' <span class="text-sm font-normal text-gray-500">$SNAKE</span>');
      SafeDOM.setHTML('balance-hw', displayHw + ' <span class="text-sm font-normal text-gray-500">Unids</span>');
      SafeDOM.setText('user-co2', displayCo2 + ' Kg');

      SecureStorage.set('snakesol_portfolio_state', window.mockState);
      updateUSDValue();
      if (window.updateROIUSD) window.updateROIUSD();
      if (window.renderBadges) window.renderBadges();
      if (window.renderLeaderboard) window.renderLeaderboard();
    };

    // ========================================================================
    // TRANSACTION LOGGING
    // ========================================================================
    window.addLogEntry = function(actionName, signature, saveToStorage = true) {
      const logList = document.getElementById('tx-log');
      if (!logList) return;

      const emptyMsg = document.getElementById('empty-log-msg');
      if (emptyMsg) emptyMsg.style.display = 'none';

      const newLog = document.createElement('div');
      newLog.className = 'flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl text-sm animate-[fade-in_0.3s_ease-out] mb-2';

      const left = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'font-bold text-white mb-1';
      title.textContent = String(actionName || 'Transação');
      left.appendChild(title);

      const codeWrap = document.createElement('div');
      codeWrap.className = 'flex items-center gap-2';
      const code = document.createElement('code');
      code.className = 'text-xs text-brand-accent bg-brand-accent/10 px-2 py-1 rounded';
      code.textContent = 'Solana ' + String(signature || '').slice(0, 4) + '...' + String(signature || '').slice(-4);
      codeWrap.appendChild(code);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'text-gray-400 hover:text-white transition-colors';
      copyBtn.title = 'Copiar TX';
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyBtn.addEventListener('click', () => {
        if (navigator.clipboard && signature) navigator.clipboard.writeText(signature).catch(() => {});
      });
      codeWrap.appendChild(copyBtn);
      left.appendChild(codeWrap);

      const right = document.createElement('div');
      right.className = 'flex flex-col items-end';
      const explorer = document.createElement('a');
      explorer.href = 'https://explorer.solana.com/tx/' + encodeURIComponent(String(signature || '')) + '?cluster=devnet';
      explorer.target = '_blank';
      explorer.rel = 'noreferrer';
      explorer.className = 'text-xs text-[#9945FF] hover:underline';
      explorer.textContent = 'Ver no Explorer';
      right.appendChild(explorer);

      const stamp = document.createElement('span');
      stamp.className = 'text-xs text-gray-500 mt-1';
      stamp.textContent = 'Agora mesmo';
      right.appendChild(stamp);

      newLog.appendChild(left);
      newLog.appendChild(right);
      logList.insertBefore(newLog, logList.firstChild);
      if (logList.children.length > 20) logList.removeChild(logList.lastChild);

      if (saveToStorage) {
        const history = SecureStorage.get('snakeTxHistory', []);
        if (Array.isArray(history)) {
          history.unshift({ actionName, signature });
          if (history.length > 20) history.pop();
          SecureStorage.set('snakeTxHistory', history);
        }
      }
    };

    window.loadTxHistory = function() {
      const history = SecureStorage.get('snakeTxHistory', []);
      if (!Array.isArray(history)) return;
      history.slice().reverse().forEach((tx) => {
        window.addLogEntry(tx.actionName, tx.signature, false);
      });
    };

    // ========================================================================
    // MODAL HELPERS (P2P, Sizing, etc.)
    // ========================================================================
    window.showP2PModal = function() {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }
      SafeDOM.setText('p2p-avail-solarfazenda', String(window.mockState.p2p.solarfazenda));
      SafeDOM.setText('p2p-avail-pedro', String(window.mockState.p2p.pedro));
      SafeDOM.setText('p2p-avail-condominio', String(window.mockState.p2p.condominio));

      const modal = document.getElementById('p2p-modal');
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
          modal.classList.remove('opacity-0');
          const content = document.getElementById('p2p-modal-content');
          if (content) content.classList.remove('scale-95');
        }, 10);
      }
    };

    window.closeP2PModal = function() {
      const modal = document.getElementById('p2p-modal');
      const content = document.getElementById('p2p-modal-content');
      const feedback = document.getElementById('p2p-feedback');
      if (feedback) feedback.classList.add('hidden');
      if (modal) modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 300);
    };

    window.processP2P = async function(sellerId, sellerName) {
      const input = document.getElementById('p2p-input-' + sellerId);
      if (!input) return;

      try {
        const amount = SecurityValidation.validateAmount(input.value, 1, 100000);
        if (amount > window.mockState.p2p[sellerId]) {
          SafeDOM.createToast('Produtor só tem ' + window.mockState.p2p[sellerId] + ' kWh disponíveis.', 'error');
          return;
        }
        input.disabled = true;
        await window.submitP2PPurchase(amount, sellerName);
        input.value = '';
        input.disabled = false;
      } catch (err) {
        SafeDOM.createToast(err.message || 'Quantidade inválida', 'error');
      }
    };

    window.submitP2PPurchase = async function(amount, seller) {
      const feedback = document.getElementById('p2p-feedback');
      if (feedback) feedback.classList.remove('hidden');
      await window.executeTransaction('Comprar ' + amount + ' $ENERGY P2P (' + seller + ')');
      setTimeout(() => window.closeP2PModal(), 1000);
    };

    // ========================================================================
    // SIZING MODAL
    // ========================================================================
    let currentSizingPrice = 0;

    window.openSizingModal = function() {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }
      window.resetSizing();
      const modal = document.getElementById('sizing-modal');
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
          modal.classList.remove('opacity-0');
          const content = document.getElementById('sizing-modal-content');
          if (content) content.classList.remove('scale-95');
        }, 10);
      }
    };

    window.closeSizingModal = function() {
      const modal = document.getElementById('sizing-modal');
      const content = document.getElementById('sizing-modal-content');
      if (modal) modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 300);
    };

    window.calculateSizing = function() {
      try {
        const base = SecurityValidation.validateAmount(document.getElementById('sizing-base').value, 50, 100000);
        const ac = SecurityValidation.validateAmount(document.getElementById('sizing-ac').value, 0, 100);
        const extra = SecurityValidation.validateAmount(document.getElementById('sizing-extra').value, 0, 100000);
        const pool = document.getElementById('sizing-pool').checked;

        const addAc = ac * 100;
        const addPool = pool ? 250 : 0;
        const totalAdd = addAc + addPool + extra;
        const totalConsumption = base + totalAdd;
        const recommendedCapacity = Math.ceil((totalConsumption * 1.15) / 10) * 10;

        currentSizingPrice = recommendedCapacity * 8;

        SafeDOM.setText('res-base', base + ' kWh');
        SafeDOM.setText('res-add', '+ ' + totalAdd + ' kWh');
        SafeDOM.setHTML('res-total', recommendedCapacity + ' kWh <span class="text-sm font-normal text-gray-500">/ mês</span>');
        SafeDOM.setText('res-price', currentSizingPrice.toLocaleString('en-US') + ' USDT');

        document.getElementById('sizing-step-1').classList.add('hidden');
        document.getElementById('sizing-step-2').classList.remove('hidden');
      } catch (err) {
        SafeDOM.createToast(err.message, 'error');
      }
    };

    window.resetSizing = function() {
      document.getElementById('sizing-step-1').classList.remove('hidden');
      document.getElementById('sizing-step-2').classList.add('hidden');
    };

    window.confirmSizingPurchase = async function() {
      window.closeSizingModal();
      await window.executeTransaction('Adquirir Kit Solar DePIN (' + currentSizingPrice + ' USDT)');
    };

    // ========================================================================
    // MAP INVEST MODAL
    // ========================================================================
    window.openMapInvestModal = function(targetName) {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }
      const modal = document.getElementById('map-invest-modal');
      const targetEl = document.getElementById('map-invest-target');
      const inputEl = document.getElementById('map-invest-amount');
      if (targetEl) SafeDOM.setText('map-invest-target', 'Alvo: ' + targetName);
      if (inputEl) inputEl.value = '500';
      window.currentMapTarget = targetName;
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
          modal.classList.remove('opacity-0');
          const content = document.getElementById('map-invest-modal-content');
          if (content) content.classList.remove('scale-95');
        }, 10);
      }
    };

    window.closeMapInvestModal = function() {
      const modal = document.getElementById('map-invest-modal');
      const content = document.getElementById('map-invest-modal-content');
      if (modal) modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 300);
    };

    window.confirmMapInvestment = async function() {
      try {
        const input = document.getElementById('map-invest-amount');
        if (!input) return;
        const amount = SecurityValidation.validateAmount(input.value, 10, 1000000);
        window.closeMapInvestModal();
        await window.executeTransaction('Investir ' + amount + ' USDT em ' + (window.currentMapTarget || 'DePIN'));
      } catch (err) {
        SafeDOM.createToast(err.message, 'error');
      }
    };

    // ========================================================================
    // STAKE MODAL
    // ========================================================================
    window.showStakeModal = function() {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }
      const modal = document.getElementById('stake-modal');
      if (modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const content = document.getElementById('stake-modal-content');
        if (content) {
          content.classList.remove('scale-95');
          content.classList.add('scale-100');
        }
      }
    };

    window.closeStakeModal = function() {
      const modal = document.getElementById('stake-modal');
      const content = document.getElementById('stake-modal-content');
      if (modal) {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
      }
      if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
      }
      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 300);
    };

    window.submitStake = async function() {
      try {
        const amount = SecurityValidation.validateAmount(document.getElementById('stake-amount').value, 1, 1000000);
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
      } catch (err) {
        SafeDOM.createToast(err.message, 'error');
      }
    };

    // ========================================================================
    // DEX SWAP
    // ========================================================================
    const DEX_RATES = {
      'SOL_ENERGY': 950,
      'ENERGY_SOL': 0.00105,
      'SOL_SNAKE': 120,
      'SNAKE_SOL': 0.0083,
      'ENERGY_SNAKE': 0.126,
      'SNAKE_ENERGY': 7.93
    };

    window.updateSwapCalculation = function() {
      try {
        const fromToken = document.getElementById('swap-from-token').value;
        const toToken = document.getElementById('swap-to-token').value;
        const amountIn = SecurityValidation.validateDecimal(document.getElementById('swap-input').value, 0, 1000000);

        SafeDOM.setText('dex-from-lbl', fromToken);

        if (fromToken === toToken) {
          document.getElementById('swap-output').value = amountIn.toFixed(2);
          return;
        }

        const pair = fromToken + '_' + toToken;
        const rate = DEX_RATES[pair] || 1;
        document.getElementById('swap-output').value = (amountIn * rate).toFixed(4);
      } catch (err) {
        SafeDOM.createToast('Valor de swap inválido', 'error');
      }
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
      if (fromToken === toToken) {
        SafeDOM.createToast('Selecione tokens diferentes para trocar.', 'warning');
        return;
      }
      const amountIn = document.getElementById('swap-input').value;
      window.executeTransaction('Swap ' + amountIn + ' ' + fromToken + ' por $' + toToken + ' na DEX');
    };

    // ========================================================================
    // VOTE MODAL
    // ========================================================================
    window.showVoteModal = function() {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }
      const modal = document.getElementById('vote-modal');
      if (modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const content = document.getElementById('vote-modal-content');
        if (content) {
          content.classList.remove('scale-95');
          content.classList.add('scale-100');
        }
      }
    };

    window.closeVoteModal = function() {
      const modal = document.getElementById('vote-modal');
      const content = document.getElementById('vote-modal-content');
      if (modal) {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
      }
      if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
      }
      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 300);
    };

    window.submitVote = async function() {
      try {
        const selected = document.querySelector('input[name="dao-vote"]:checked');
        if (!selected) throw new Error('Selecione uma opção de voto');
        const selectedOption = selected.value;
        const weight = SecurityValidation.validateAmount(document.getElementById('vote-weight').value, 1, 1000000);

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
      } catch (err) {
        SafeDOM.createToast(err.message, 'error');
      }
    };

    // ========================================================================
    // MAIN TRANSACTION EXECUTION (with Rate Limiting)
    // ========================================================================
    window.executeTransaction = async function(actionName) {
      if (!window.isPhantomConnected || !userPublicKey) {
        SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
        return;
      }

      if (!RateLimiter.canExecute()) {
        SafeDOM.createToast('Aguarde a transação anterior completar...', 'warning');
        return;
      }

      RateLimiter.markExecuting();

      const buttons = document.querySelectorAll('button');
      let targetButton = null;
      buttons.forEach((btn) => {
        if (btn.textContent.includes(actionName.split(' ')[0])) targetButton = btn;
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
          await new Promise((resolve) => setTimeout(resolve, 2000));
          signature = 'mockTx' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
          window.addLogEntry(actionName, signature);
          window.updateMockBalances(actionName);
          if (actionName.includes('Equipamento IoT') || actionName.includes('Kit Solar') || actionName.toLowerCase().includes('kit solar') || actionName.includes('Carregador VE')) {
            window.showNFTModal();
          } else {
            SafeDOM.createToast('⚡ Transação Confirmada!\n\n(Modo Demonstração: Nenhuma blockchain real foi usada).', 'success');
          }
          RateLimiter.markComplete();
          return;
        }

        let validPublicKey = userPublicKey;
        if (typeof userPublicKey === 'string') {
          validPublicKey = new solanaWeb3.PublicKey(userPublicKey);
        }

        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'processed');
        const transaction = new solanaWeb3.Transaction();
        const memoProgramId = new solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        const memoPayload = SecurityValidation.sanitizeText(String(actionName || 'SNAKESOL_TX')).slice(0, 120);

        transaction.add(
          solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 1000000
          })
        );

        transaction.add(new solanaWeb3.TransactionInstruction({
          keys: [],
          programId: memoProgramId,
          data: new TextEncoder().encode(memoPayload)
        }));

        transaction.add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey: validPublicKey,
            toPubkey: validPublicKey,
            lamports: Math.floor(0.001 * solanaWeb3.LAMPORTS_PER_SOL)
          })
        );

        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = validPublicKey;

        if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Aprove na Phantom...';

        const signedTransaction = await phantomProvider.signTransaction(transaction);

        if (targetButton) targetButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Confirmando...';

        signature = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false });
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');

        SafeDOM.createToast('⚡ Transação Confirmada na Blockchain!\n\nA transação real foi gravada na Devnet com sucesso.', 'success');

        window.addLogEntry(actionName, signature);
        window.updateMockBalances(actionName);

        if (actionName.includes('Equipamento IoT') || actionName.includes('Kit Solar') || actionName.toLowerCase().includes('kit solar') || actionName.includes('Carregador VE')) {
          window.showNFTModal();
        }
      } catch (error) {
        let safeMsg = 'Erro ao processar na blockchain';
        if (error && error.message) {
          if (error.message.includes('block height exceeded') || error.message.includes('expired') || error.message.includes('timeout')) {
            safeMsg = '⚠️ Transação Enviada (Rede Lenta)!\n\nA Devnet está congestionada.';
          } else if (error.message.toLowerCase().includes('insufficient') || error.message.includes('0x1')) {
            safeMsg = '🚫 Saldo Insuficiente!\n\nVocê precisa de SOL (Devnet) para pagar as taxas.';
          } else if (error.message.includes('User rejected')) {
            safeMsg = 'Você cancelou a assinatura da transação.';
          }
        }
        SafeDOM.createToast(safeMsg, 'error');
      } finally {
        if (targetButton) {
          targetButton.innerHTML = originalHtml;
          targetButton.disabled = false;
        }
        RateLimiter.markComplete();
      }
    };

    // ========================================================================
    // BADGES RENDERING
    // ========================================================================
    window.renderBadges = function() {
      const container = document.getElementById('badges-container');
      if (!container) return;

      container.innerHTML = '';
      if (!window.isPhantomConnected) return;

      let hasBadges = false;

      if (window.mockState.co2 > 0) {
        container.innerHTML += '<div class="bg-green-900/40 border border-green-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]"><i class="fa-solid fa-leaf text-green-400 text-lg"></i><div><p class="text-xs text-gray-400">Carbon Neutral</p><p class="text-sm font-bold text-green-400">' + window.mockState.co2.toFixed(1) + ' Kg</p></div></div>';
        hasBadges = true;
      }

      if (window.mockState.snake >= 50) {
        container.innerHTML += '<div class="bg-purple-900/40 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]"><i class="fa-solid fa-whale text-purple-400 text-lg"></i><div><p class="text-xs text-gray-400">Whale Holder</p><p class="text-sm font-bold text-purple-400">' + window.mockState.snake + ' $SNAKE</p></div></div>';
        hasBadges = true;
      }

      if (window.mockState.hw > 0) {
        container.innerHTML += '<div class="bg-amber-900/40 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]"><i class="fa-solid fa-server text-amber-400 text-lg"></i><div><p class="text-xs text-gray-400">DePIN Operator</p><p class="text-sm font-bold text-amber-400">' + window.mockState.hw + ' Node' + (window.mockState.hw > 1 ? 's' : '') + '</p></div></div>';
        hasBadges = true;
      }

      if (!hasBadges) {
        container.innerHTML = '<p class="text-sm text-gray-500 w-full text-center py-6 italic">Realize ações na plataforma para desbloquear medalhas.</p>';
      }
    };

    window.showNFTModal = function() {
      const modal = document.getElementById('nft-modal');
      if (!modal) return;
      const edition = document.getElementById('nft-edition');
      if (edition) edition.textContent = String(Math.floor(Math.random() * 9000) + 1000);
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('.transform');
        if (content) content.classList.remove('scale-95');
      }, 10);
    };

    window.closeNFTModal = function() {
      const modal = document.getElementById('nft-modal');
      if (!modal) return;
      const content = modal.querySelector('.transform');
      modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(() => modal.classList.add('hidden'), 300);
    };

    window.renderLeaderboard = function() {
      const list = document.getElementById('leaderboard-list');
      if (!list) return;
      const base = [
        { name: 'SolarFazenda_BR', score: 9200, icon: 'fa-solar-panel' },
        { name: 'CondominioSolar_SP', score: 8800, icon: 'fa-building' },
        { name: 'EVHub_Curitiba', score: 7400, icon: 'fa-charging-station' }
      ];
      const userScore = Math.round((window.mockState.energy * 3) + (window.mockState.hw * 900) + (window.mockState.co2 * 20));
      const all = [...base, { name: 'Você', score: userScore, icon: 'fa-user-astronaut', isUser: true }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      list.innerHTML = '';
      all.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between bg-black/40 rounded-xl p-3 border ' + (entry.isUser ? 'border-brand-accent/40' : 'border-white/5');
        row.innerHTML =
          '<div class="flex items-center gap-3">' +
          '<span class="text-xs font-bold text-gray-400 w-5">#' + (idx + 1) + '</span>' +
          '<i class="fa-solid ' + entry.icon + ' text-brand-secondary"></i>' +
          '<span class="text-sm font-semibold ' + (entry.isUser ? 'text-brand-accent' : 'text-white') + '">' + SecurityValidation.sanitizeText(entry.name) + '</span>' +
          '</div>' +
          '<span class="text-xs font-mono text-gray-300">' + entry.score.toLocaleString('en-US') + ' pts</span>';
        list.appendChild(row);
      });
    };

    // ========================================================================
    // ROI SLIDER
    // ========================================================================
    const roiSlider = document.getElementById('roi-slider');
    const roiNodesValue = document.getElementById('roi-nodes-value');
    const roiEnergy = document.getElementById('roi-energy');
    const roiYield = document.getElementById('roi-yield');
    const roiUsd = document.getElementById('roi-usd');

    if (roiSlider && roiNodesValue && roiEnergy && roiYield && roiUsd) {
      roiSlider.addEventListener('input', (e) => {
        const val = SecurityValidation.validateAmount(e.target.value, 1, 50);
        SafeDOM.setText('roi-nodes-value', val + ' Nó' + (val > 1 ? 's' : ''));
        SafeDOM.setHTML('roi-energy', val * 450 + ' <span class="text-xs text-gray-500">kWh</span>');
        SafeDOM.setHTML('roi-yield', val * 150 + ' <span class="text-xs text-gray-500">$SNAKE</span>');
        window.updateROIUSD = function() {
          const yieldUsd = (val * 150 * 0.12).toFixed(2);
          SafeDOM.setText('roi-usd', '~ $' + yieldUsd + ' USD');
        };
        window.updateROIUSD();
      });
      roiSlider.dispatchEvent(new Event('input'));
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    document.querySelectorAll('[data-tab]').forEach((el) => {
      el.addEventListener('click', () => {
        const tabId = el.getAttribute('data-tab');
        if (tabId) window.switchTab(tabId);
      });
    });

    bindClick('connect-wallet-btn', () => window.connectPhantom());
    bindClick('btn-emit-carbon', () => window.executeTransaction('Emitir NFT de Crédito de Carbono'));
    bindClick('btn-open-sizing', () => window.openSizingModal());
    bindClick('btn-buy-wallbox', () => window.executeTransaction('Comprar Carregador VE'));
    bindClick('btn-show-p2p', () => window.showP2PModal());
    bindClick('btn-pay-ev', () => window.executeTransaction('Pagar Recarga VE com $ENERGY'));
    bindClick('btn-show-stake', () => window.showStakeModal());
    bindClick('btn-show-vote', () => window.showVoteModal());
    bindClick('btn-do-swap', () => window.executeSwap());
    bindClick('swap-invert-btn', () => window.invertSwap());
    bindClick('close-nft-btn', () => window.closeNFTModal());
    bindClick('close-vote-btn', () => window.closeVoteModal());
    bindClick('close-stake-btn', () => window.closeStakeModal());
    bindClick('close-sizing-btn', () => window.closeSizingModal());
    bindClick('calculate-sizing-btn', () => window.calculateSizing());
    bindClick('reset-sizing-btn', () => window.resetSizing());
    bindClick('confirm-sizing-btn', () => window.confirmSizingPurchase());
    bindClick('close-map-invest-btn', () => window.closeMapInvestModal());
    bindClick('confirm-map-invest-btn', () => window.confirmMapInvestment());
    bindClick('close-p2p-btn', () => window.closeP2PModal());

    const swapInput = document.getElementById('swap-input');
    if (swapInput) swapInput.addEventListener('input', () => window.updateSwapCalculation());
    const swapFromToken = document.getElementById('swap-from-token');
    if (swapFromToken) swapFromToken.addEventListener('change', () => window.updateSwapCalculation());
    const swapToToken = document.getElementById('swap-to-token');
    if (swapToToken) swapToToken.addEventListener('change', () => window.updateSwapCalculation());

    const logisticForm = document.getElementById('logistic-form');
    if (logisticForm) {
      logisticForm.addEventListener('submit', (event) => {
        if (typeof window.handleFullRegistration === 'function') {
          window.handleFullRegistration(event);
        } else {
          event.preventDefault();
        }
      });
    }

    document.querySelectorAll('.p2p-buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sellerId = btn.getAttribute('data-seller-id');
        const sellerName = btn.getAttribute('data-seller-name');
        if (sellerId && sellerName) window.processP2P(sellerId, sellerName);
      });
    });

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.map-invest-btn') : null;
      if (!target) return;
      const encoded = target.getAttribute('data-target') || '';
      let name = '';
      try {
        name = decodeURIComponent(encoded);
      } catch (err) {
        name = encoded;
      }
      if (name) window.openMapInvestModal(name);
    });

    window.updateMockBalances('');
    window.loadTxHistory();
    if (window.renderBadges) window.renderBadges();
    if (window.renderLeaderboard) window.renderLeaderboard();
  });
})();

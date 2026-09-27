# 📖 SECURITY IMPLEMENTATION GUIDE

Este documento detalha como usar os módulos de segurança implementados no MVP.

---

## 🔒 SecurityValidation Module

### Validar Quantidade (amounts)

```javascript
// Valida se é inteiro, dentro do range [min, max]
try {
  const amount = SecurityValidation.validateAmount(userInput, 1, 100000);
  console.log("Valor válido:", amount);
} catch (err) {
  SafeDOM.createToast(err.message, 'error');
}
```

**Parâmetros:**
- `value` - valor do input
- `min` - valor mínimo (default: 0)
- `max` - valor máximo (default: 1000000)

**Retorna:** número inteiro validado  
**Lança:** Error se inválido

---

### Sanitizar Texto

```javascript
// Remove caracteres perigosos (<, >, ", ', &)
const safeText = SecurityValidation.sanitizeText(userText);
element.textContent = safeText;
```

**Uso:** Antes de exibir dados do usuário

---

### Validar Email

```javascript
try {
  const email = SecurityValidation.validateEmail(userEmail);
  // Use email seguro
} catch (err) {
  SafeDOM.createToast('Email inválido', 'error');
}
```

---

### Validar Telefone

```javascript
try {
  const phone = SecurityValidation.validatePhone(userPhone);
  // Use phone seguro
} catch (err) {
  SafeDOM.createToast('Telefone inválido', 'error');
}
```

---

## 💾 SecureStorage Module

### Salvar em Session

```javascript
const userData = { energy: 100, snake: 50 };
SecureStorage.set('snakesol_portfolio_state', userData);
```

**Nota:** Dados são deletados ao fechar a aba

---

### Recuperar da Session

```javascript
const userData = SecureStorage.get('snakesol_portfolio_state', {});
// Se não existir, retorna {} (default)
```

---

### Remover da Session

```javascript
SecureStorage.remove('snakesol_portfolio_state');
```

---

## ⏱️ RateLimiter Module

### Bloquear Cliques Duplos

```javascript
if (!RateLimiter.canExecute()) {
  SafeDOM.createToast('Aguarde a transação anterior...', 'warning');
  return;
}

RateLimiter.markExecuting();

try {
  // Executar transação
  await executeTransaction();
} finally {
  RateLimiter.markComplete();
}
```

**Benefícios:**
- Impede spam de transações
- Melhora UX (feedback claro)
- Protege backend (se houver)

---

## 🎨 SafeDOM Module

### Setar Texto (Seguro)

```javascript
SafeDOM.setText('my-element-id', 'Novo texto aqui');
// Usa textContent (não pode ter HTML)
```

**Uso:** Dados dinâmicos, valores do usuário

---

### Setar HTML (Cuidado)

```javascript
SafeDOM.setHTML('my-element-id', '<b>HTML permitido</b>');
// Usa innerHTML (cuidado com XSS!)
```

**Uso:** Apenas para HTML pré-definido (não dinâmico)

---

### Criar Toast Notifications

```javascript
SafeDOM.createToast('Operação sucesso!', 'success');
SafeDOM.createToast('Erro ao conectar', 'error');
SafeDOM.createToast('Aguarde...', 'info');
SafeDOM.createToast('Atenção!', 'warning');
```

**Tipos:**
- `success` - Verde
- `error` - Vermelho
- `info` - Azul
- `warning` - Amarelo

---

## 🔐 Exemplos Práticos

### Exemplo 1: Executar Transação com Segurança

```javascript
window.executeTransaction = async function(actionName) {
  // 1. Validar estado
  if (!window.isPhantomConnected) {
    SafeDOM.createToast('Conecte a carteira primeiro!', 'warning');
    return;
  }

  // 2. Verificar rate limit
  if (!RateLimiter.canExecute()) {
    SafeDOM.createToast('Aguarde...', 'warning');
    return;
  }
  RateLimiter.markExecuting();

  try {
    // 3. Sanitizar nome da ação
    const safeName = SecurityValidation.sanitizeText(actionName);
    
    // 4. Executar (pode falhar)
    const signature = await phantomProvider.signAndSendTransaction(...);
    
    // 5. Log seguro
    window.addLogEntry(safeName, signature);
    
    // 6. Feedback seguro
    SafeDOM.createToast('Sucesso!', 'success');
  } catch (error) {
    // 7. Erro genérico (sem expor internals)
    SafeDOM.createToast('Erro ao processar', 'error');
  } finally {
    RateLimiter.markComplete();
  }
};
```

---

### Exemplo 2: Validar Form de Compra

```javascript
function processP2PPurchase() {
  const sellerId = 'solarfazenda';
  const input = document.getElementById('p2p-input-' + sellerId);

  try {
    // 1. Validar entrada
    const amount = SecurityValidation.validateAmount(
      input.value, 
      1,         // mínimo
      100000     // máximo
    );

    // 2. Validar disponibilidade
    if (amount > window.mockState.p2p[sellerId]) {
      SafeDOM.createToast(
        'Produtor tem apenas ' + window.mockState.p2p[sellerId] + ' kWh',
        'error'
      );
      return;
    }

    // 3. Desabilitar input
    input.disabled = true;

    // 4. Executar com rate limit
    if (!RateLimiter.canExecute()) {
      SafeDOM.createToast('Aguarde...', 'warning');
      return;
    }
    RateLimiter.markExecuting();

    // 5. Executar transação
    executeTransaction('Comprar ' + amount + ' $ENERGY P2P');

  } catch (err) {
    // 6. Feedback seguro
    SafeDOM.createToast(err.message, 'error');
  } finally {
    input.disabled = false;
    RateLimiter.markComplete();
  }
}
```

---

### Exemplo 3: Salvar e Recuperar Estado

```javascript
// Ao desconectar
function disconnectWallet() {
  // Salvar estado antes de desconectar
  SecureStorage.set('snakesol_portfolio_state', window.mockState);
  SecureStorage.set('snakeTxHistory', txHistory);
  
  isPhantomConnected = false;
  SafeDOM.createToast('Desconectado', 'info');
}

// Ao carregar
function loadUserState() {
  const savedState = SecureStorage.get('snakesol_portfolio_state', defaultState);
  window.mockState = savedState;
  
  const txHistory = SecureStorage.get('snakeTxHistory', []);
  txHistory.forEach(tx => window.addLogEntry(tx.actionName, tx.signature));
}
```

---

## ❌ Anti-Patterns (NÃO FAÇA)

### ❌ Usar innerHTML com dados dinâmicos

```javascript
// ERRADO - XSS vulnerability!
element.innerHTML = `<div>${userInput}</div>`;

// CERTO
SafeDOM.setText('element-id', userInput);
```

---

### ❌ Validação manual incompleta

```javascript
// ERRADO - sem limites
const amount = parseInt(input.value);

// CERTO
const amount = SecurityValidation.validateAmount(input.value, 1, 1000000);
```

---

### ❌ Usar localStorage para dados sensíveis

```javascript
// ERRADO - persiste indefinidamente
localStorage.setItem('wallet_key', privateKey);

// CERTO - expira ao fechar aba
sessionStorage.setItem('wallet_data', safeData);
```

---

### ❌ Expor erros ao usuário

```javascript
// ERRADO
catch (err) {
  showToast(err.message); // Pode expor internals
}

// CERTO
catch (err) {
  showToast('Erro ao processar. Tente novamente.');
}
```

---

### ❌ Permitir múltiplas transações simultâneas

```javascript
// ERRADO - sem rate limit
button.onclick = executeTransaction;

// CERTO
button.onclick = function() {
  if (!RateLimiter.canExecute()) return;
  RateLimiter.markExecuting();
  executeTransaction().finally(() => RateLimiter.markComplete());
};
```

---

## 🧪 Testes de Segurança

### Teste XSS

```javascript
// No console do navegador
SafeDOM.setText('test-element', '<img src=x onerror=alert("XSS")>');
// Deve exibir string literal, não executar alert
```

### Teste Validação

```javascript
try {
  SecurityValidation.validateAmount('999999999', 1, 1000);
} catch (err) {
  console.log('Validação funcionou:', err.message);
}
```

### Teste Rate Limiting

```javascript
// Clique o botão 5 vezes rapidamente
button.click(); // OK
button.click(); // Bloqueado (aviso)
button.click(); // Bloqueado (aviso)
```

### Teste Storage

```javascript
SecureStorage.set('test', {data: 123});
console.log(SecureStorage.get('test', {})); // {data: 123}
// Feche a aba e reabra
console.log(SecureStorage.get('test', {})); // {} (deletado)
```

---

## 📝 Checklist para Code Review

Ao revisar código seguro:

- [ ] Todos os inputs foram validados com `SecurityValidation`?
- [ ] Dados dinâmicos usam `SafeDOM.setText()`, não `innerHTML`?
- [ ] Transações têm rate limit com `RateLimiter`?
- [ ] Erros são genéricos, não expõem internals?
- [ ] Dados sensíveis usam `sessionStorage`, não `localStorage`?
- [ ] URLs com `encodeURIComponent()`?
- [ ] Sem `console.log()` com dados sensíveis?
- [ ] Sem `eval()` ou `Function()` construtor?

---

## 🚨 Reportar Vulnerabilidades

Viu algo suspeito?

1. **NÃO** abra issue público
2. **Envie email** para `security@snakesolenergy.io`
3. **Aguarde resposta** em 48 horas
4. **Coordene** a correção antes de divulgar

---

**Última atualização:** 2026-09-27

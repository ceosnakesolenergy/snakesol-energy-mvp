# 🛡️ SECURITY POLICY

## Reporting Security Vulnerabilities

Se você descobriu uma vulnerabilidade de segurança no **snakesol-energy-mvp**, por favor:

### ⚠️ NÃO abra um issue público

1. **Envie um email** para `security@snakesolenergy.io` com:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de fix (opcional)

2. **Aguarde resposta** dentro de 48 horas

3. **Coordenação** - Trabalharemos junto para corrigir antes de divulgar publicamente

---

## Vulnerabilidades Conhecidas

### ✅ Corrigidas (v0.1.0+)

- **XSS via innerHTML** - FIXED: Safe DOM manipulation
- **localStorage inseguro** - FIXED: sessionStorage
- **Missing CSP** - FIXED: CSP meta tag
- **Input validation** - FIXED: ValidationModule
- **Rate limiting** - FIXED: RateLimiter module

### ⏳ Pendentes (roadmap v0.2+)

- **SRI em CDNs** - Será adicionado em v0.2
- **HTTPS enforcement** - Será implementado em v0.2

---

## Security Best Practices

### Para Usuários

1. **Nunca compartilhe sua seed phrase**
2. **Sempre use Phantom Wallet oficial**
3. **Verifique URLs antes de conectar**
4. **Use HTTPS sempre**
5. **Feche a aba após usar** (sessionStorage é temporário)

### Para Desenvolvedores

1. **Sempre valide inputs** - Use `SecurityValidation` module
2. **Nunca use innerHTML com dados dinâmicos** - Use `SafeDOM.setText()`
3. **Use sessionStorage, nunca localStorage** - Para dados sensíveis
4. **Rate limit transações** - Use `RateLimiter` module
5. **Erros genéricos ao usuário** - Não exponha detalhes internos

---

## Security Headers

O projeto implementa:

```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Dependências e Vulnerabilidades

Para verificar dependências seguras:

```bash
npm audit
npm audit fix
```

---

## Roadmap de Segurança

- [x] v0.1 - Input validation, XSS prevention, CSP
- [ ] v0.2 - SRI, HTTPS
- [ ] v0.3 - Audit profissional
- [ ] v1.0 - Bug bounty program

---

## Contato

**Email:** security@snakesolenergy.io  
**Discord:** https://discord.gg/snakesolenergy  
**GitHub Issues:** Apenas para non-security issues

// Lógica de Cadastro Logístico
(function setupOnboarding() {
    'use strict';

    const sanitizeText = (value) => String(value ?? '').replace(/[<>"'&]/g, '');

    const validate = ({ name, phone, email, uc, address }) => {
        if (name.trim().length < 5) throw new Error('Informe o nome completo.');
        if (!/^[\d\s\-\+\(\)]+$/.test(phone) || phone.replace(/\D/g, '').length < 10) {
            throw new Error('Telefone inválido.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido.');
        if (uc.trim().length < 4) throw new Error('Unidade Consumidora inválida.');
        if (address.trim().length < 8) throw new Error('Endereço inválido.');
    };

    window.handleFullRegistration = function(event) {
        event.preventDefault();

        const payload = {
            name: sanitizeText(document.getElementById('reg-name')?.value || ''),
            phone: sanitizeText(document.getElementById('reg-phone')?.value || ''),
            email: sanitizeText(document.getElementById('reg-email')?.value || ''),
            uc: sanitizeText(document.getElementById('reg-uc')?.value || ''),
            address: sanitizeText(document.getElementById('reg-address')?.value || '')
        };

        try {
            validate(payload);
            const normalizedPhone = payload.phone.replace(/\D/g, '');
            const maskedPhone = normalizedPhone.replace(/\d(?=\d{2})/g, '*');
            const [emailUser] = payload.email.split('@');
            const maskedEmail = (emailUser ? emailUser.slice(0, 2) : 'xx') + '***@***';
            const sessionProfile = {
                name: payload.name.split(' ')[0],
                phoneMasked: maskedPhone,
                emailMasked: maskedEmail,
                ucLast4: payload.uc.slice(-4),
                savedAt: new Date().toISOString()
            };
            sessionStorage.setItem('snakesol_logistic_profile', JSON.stringify(sessionProfile));
        } catch (err) {
            if (window.showToast) {
                window.showToast(err.message || 'Dados de cadastro inválidos.', 'error');
            }
            return;
        }

        const funnel = document.getElementById('email-funnel');
        if (funnel) {
            funnel.style.transition = 'opacity 0.5s ease';
            funnel.style.opacity = '0';
            setTimeout(() => { funnel.style.display = 'none'; }, 500);
        }

        const firstName = payload.name.split(' ')[0] || 'Usuário';
        const msg = `📦 Cadastro Logístico Concluído!\n\nOlá, ${firstName}. Apenas um resumo mascarado foi salvo nesta sessão para continuidade do onboarding.\n\n🔗 PRÓXIMO PASSO:\nConecte sua Phantom para registrar suas interações na Solana Devnet.`;
        if (window.showToast) {
            window.showToast(msg, 'success');
        } else {
            alert(msg);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
})();

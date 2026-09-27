// Lógica de Cadastro Logístico (Sem falsa carteira Web3)
(function onboardingModule() {
    'use strict';

    function validateRegistrationInput() {
        const name = String(document.getElementById('reg-name')?.value || '').trim();
        const phone = String(document.getElementById('reg-phone')?.value || '').trim();
        const email = String(document.getElementById('reg-email')?.value || '').trim();
        const uc = String(document.getElementById('reg-uc')?.value || '').trim();
        const address = String(document.getElementById('reg-address')?.value || '').trim();

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRe = /^[\d\s\-\+\(\)]+$/;

        if (name.length < 3) throw new Error('Informe seu nome completo.');
        if (phone.length < 10 || !phoneRe.test(phone)) throw new Error('Telefone inválido.');
        if (!emailRe.test(email)) throw new Error('Email inválido.');
        if (uc.length < 3) throw new Error('Unidade consumidora inválida.');
        if (address.length < 10) throw new Error('Endereço incompleto.');

        return { name, phone, email, uc, address };
    }

    window.handleFullRegistration = function(event) {
        event.preventDefault();

        try {
            const registration = validateRegistrationInput();

            try {
                sessionStorage.setItem('snakesol_logistic_onboarding', JSON.stringify({
                    name: registration.name,
                    phone: registration.phone,
                    email: registration.email,
                    uc: registration.uc,
                    address: registration.address,
                    completedAt: new Date().toISOString()
                }));
            } catch (_) {}

            const funnel = document.getElementById('email-funnel');
            if (funnel) {
                funnel.style.transition = 'opacity 0.5s ease';
                funnel.style.opacity = '0';
                setTimeout(() => { funnel.style.display = 'none'; }, 500);
            }

            const firstName = registration.name.split(/\s+/)[0];
            const msg = `📦 Cadastro Logístico Concluído!\n\nOlá, ${firstName}. Seu endereço físico foi salvo de forma segura para o envio do seu Kit Solar / Wallbox.\n\n🔗 PRÓXIMO PASSO:\nPara interagir com o ecossistema SNAKESOL ENERGY e registrar suas compras na blockchain (Devnet), clique no botão roxo "Conectar Phantom" no topo da página!`;
            if (window.showToast) {
                window.showToast(msg, 'success', 10000);
            } else {
                alert(msg);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const msg = err?.message || 'Não foi possível concluir o cadastro.';
            if (window.showToast) {
                window.showToast(msg, 'error');
            } else {
                alert(msg);
            }
        }
    };
})();

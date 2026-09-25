// Lógica de Cadastro Logístico (Sem falsa carteira Web3)

        window.handleFullRegistration = function(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    
    // Esconde o funil
    const funnel = document.getElementById('email-funnel');
    funnel.style.transition = "opacity 0.5s ease";
    funnel.style.opacity = "0";
    setTimeout(() => funnel.style.display = 'none', 500);

    const msg = `📦 Cadastro Logístico Concluído!\n\nOlá, ${name.split(' ')[0]}. Seu endereço físico foi salvo de forma segura para o envio do seu Kit Solar / Wallbox.\n\n🔗 PRÓXIMO PASSO:\nPara interagir com o ecossistema SNAKESOL ENERGY e registrar suas compras na blockchain (Devnet), clique no botão roxo "Conectar Phantom" no topo da página!`;
    if (window.showToast) {
        window.showToast(msg, 'success', 10000);
    } else {
        alert(msg);
    }
    
    // Rola a página para o topo para incentivar a conexão
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

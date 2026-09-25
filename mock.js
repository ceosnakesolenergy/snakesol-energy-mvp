        // Simulação realista de dados globais
        window.addEventListener('DOMContentLoaded', () => {
            let energyVal = 14204.50;
            let co2Val = 9182.10;
            setInterval(() => {
                energyVal += (Math.random() * 0.05);
                co2Val += (Math.random() * 0.02);
                const energyEl = document.getElementById('live-energy');
                const co2El = document.getElementById('live-co2');
                if (energyEl) energyEl.innerText = energyVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' MWh';
                if (co2El) co2El.innerText = co2Val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ton';
            }, 3000);
        });

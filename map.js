// Inicializar o Mapa Global DePIN (Leaflet.js)
var map = L.map("depin-map", {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true
}).setView([-14.2350, -51.9253], 4); // Centralizado no Brasil por padrão

// CSS para transformar o mapa padrão em um Dark Theme com Oceano Azul Escuro
var style = document.createElement('style');
style.innerHTML = `
    .leaflet-tile {
        filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%);
    }
`;
document.head.appendChild(style);

// OpenStreetMap Padrão (Sem marcas d'água irritantes)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(map);

// Ícone para Usinas Instaladas (Verde)
var usinaAtivaIcon = L.divIcon({
    className: "bg-[#14F195] w-6 h-6 rounded-full border-[3px] border-black shadow-[0_0_15px_rgba(20,241,149,0.9)] flex items-center justify-center text-black text-[12px] font-bold",
    html: "<i class=\"fa-solid fa-solar-panel\"></i>",
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// Ícone para Usinas em Construção (Laranja)
var usinaConstrucaoIcon = L.divIcon({
    className: "bg-orange-500 w-6 h-6 rounded-full border-[3px] border-black shadow-[0_0_15px_rgba(249,115,22,0.9)] flex items-center justify-center text-white text-[12px] font-bold",
    html: "<i class=\"fa-solid fa-person-digging\"></i>",
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// Ícone para Eletroposto (Azul)
var chargerIcon = L.divIcon({
    className: "bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.9)] flex items-center justify-center text-white text-[8px]",
    html: "<i class=\"fa-solid fa-bolt\"></i>",
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// Ícone para Eletroposto em Construção (Laranja)
var chargerConstrucaoIcon = L.divIcon({
    className: "bg-orange-500 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.9)] flex items-center justify-center text-white text-[8px]",
    html: "<i class=\"fa-solid fa-screwdriver-wrench\"></i>",
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// ==========================================
// CIDADES BRASILEIRAS REAIS
// ==========================================
const cidadesBrasileiras = [
    { nome: "São Paulo, SP", lat: -23.5505, lng: -46.6333 },
    { nome: "Rio de Janeiro, RJ", lat: -22.9068, lng: -43.1729 },
    { nome: "Belo Horizonte, MG", lat: -19.9208, lng: -43.9378 },
    { nome: "Salvador, BA", lat: -12.9714, lng: -38.5014 },
    { nome: "Fortaleza, CE", lat: -3.7172, lng: -38.5430 },
    { nome: "Brasília, DF", lat: -15.7801, lng: -47.9292 },
    { nome: "Curitiba, PR", lat: -25.4284, lng: -49.2733 },
    { nome: "Manaus, AM", lat: -3.1190, lng: -60.0217 },
    { nome: "Recife, PE", lat: -8.0476, lng: -34.8770 },
    { nome: "Goiânia, GO", lat: -16.6869, lng: -49.2648 },
    { nome: "Belém, PA", lat: -1.4550, lng: -48.5024 },
    { nome: "Porto Alegre, RS", lat: -30.0346, lng: -51.2177 },
    { nome: "Guarulhos, SP", lat: -23.4628, lng: -46.5333 },
    { nome: "Campinas, SP", lat: -22.9099, lng: -47.0626 },
    { nome: "São Luís, MA", lat: -2.5307, lng: -44.3068 },
    { nome: "Maceió, AL", lat: -9.6662, lng: -35.7351 },
    { nome: "Natal, RN", lat: -5.7945, lng: -35.2110 },
    { nome: "Campo Grande, MS", lat: -20.4428, lng: -54.6464 },
    { nome: "Teresina, PI", lat: -5.0892, lng: -42.8016 },
    { nome: "João Pessoa, PB", lat: -7.1153, lng: -34.8610 },
    { nome: "São José dos Campos, SP", lat: -23.1791, lng: -45.8872 },
    { nome: "Ribeirão Preto, SP", lat: -21.1704, lng: -47.8103 },
    { nome: "Uberlândia, MG", lat: -18.9113, lng: -48.2622 },
    { nome: "Sorocaba, SP", lat: -23.5015, lng: -47.4581 },
    { nome: "Aracaju, SE", lat: -10.9472, lng: -37.0731 },
    { nome: "Feira de Santana, BA", lat: -12.2660, lng: -38.9669 },
    { nome: "Cuiabá, MT", lat: -15.6010, lng: -56.0974 },
    { nome: "Joinville, SC", lat: -26.3045, lng: -48.8464 },
    { nome: "Londrina, PR", lat: -23.3103, lng: -51.1628 },
    { nome: "Juiz de Fora, MG", lat: -21.7545, lng: -43.3504 },
    { nome: "Porto Velho, RO", lat: -8.7612, lng: -63.9039 },
    { nome: "Caxias do Sul, RS", lat: -29.1683, lng: -51.1794 },
    { nome: "Macapá, AP", lat: 0.0389, lng: -51.0664 },
    { nome: "Florianópolis, SC", lat: -27.5954, lng: -48.5480 },
    { nome: "Vila Velha, ES", lat: -20.3297, lng: -40.2925 },
    { nome: "Campina Grande, PB", lat: -7.2307, lng: -35.8811 },
    { nome: "Pelotas, RS", lat: -31.7654, lng: -52.3376 },
    { nome: "Boa Vista, RR", lat: 2.8235, lng: -60.6758 },
    { nome: "Vitória, ES", lat: -20.3155, lng: -40.3128 },
    { nome: "Palmas, TO", lat: -10.1843, lng: -48.3000 },
    { nome: "Rio Branco, AC", lat: -9.9749, lng: -67.8243 },
    { nome: "Maringá, PR", lat: -23.4205, lng: -51.9333 },
    { nome: "Blumenau, SC", lat: -26.9194, lng: -49.0661 },
    { nome: "Cascavel, PR", lat: -24.9573, lng: -53.4590 },
    { nome: "Petrolina, PE", lat: -9.3883, lng: -40.5019 },
    { nome: "Santarém, PA", lat: -2.4430, lng: -54.7083 },
    { nome: "Bauru, SP", lat: -22.3145, lng: -49.0587 },
    { nome: "Franca, SP", lat: -20.5386, lng: -47.4008 }
];

cidadesBrasileiras.forEach((cidade, index) => {
    // ELETROPOSTOS (1 a 3 por cidade)
    const numEletropostos = Math.floor(Math.random() * 3) + 1;
    for(let i=0; i<numEletropostos; i++) {
        // Offset micro (0.005 = ~500 metros) para garantir que fica exatamente na cidade e nunca cai no mar
        let latE = cidade.lat + (Math.random() - 0.5) * 0.005;
        let lngE = cidade.lng + (Math.random() - 0.5) * 0.005;
        
        L.marker([latE, lngE], {icon: chargerIcon}).bindPopup(`
            <div class="text-center p-1 w-36">
                <b class="text-sm">Eletroposto #${index * 3 + i}</b><br>
                <span class="text-[10px] text-gray-300">${cidade.nome}</span><br>
                <button onclick="window.openMapInvestModal('Eletroposto em ${cidade.nome}')" class="mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded w-full transition-colors">
                    Patrocinar Nó (USDT)
                </button>
            </div>
        `).addTo(map);
    }
    
    // USINAS SOLARES (1 a cada 2 cidades)
    if (index % 2 === 0 || Math.random() > 0.5) {
        // Offset micro para a Usina
        const latOffsetUsina = (Math.random() - 0.5) * 0.008; 
        const lngOffsetUsina = (Math.random() - 0.5) * 0.008; 
        const megawatts = (Math.random() * 10 + 1).toFixed(1);
        
        L.marker([cidade.lat + latOffsetUsina, cidade.lng + lngOffsetUsina], {icon: usinaAtivaIcon}).bindPopup(`
            <div class="text-center p-1 w-48">
                <h4 class="font-bold text-lg mb-1">Usina Solar DePIN</h4>
                <span class="bg-[#14F195]/20 text-[#14F195] text-[10px] px-2 py-0.5 rounded border border-[#14F195]/50 inline-block mb-2">● Gerando Energia</span>
                <p class="text-[11px] text-gray-300 mb-3">${cidade.nome}<br>Capacidade: ${megawatts} MW</p>
                <button onclick="window.openMapInvestModal('Usina em ${cidade.nome}')" class="w-full text-xs bg-[#14F195] hover:bg-[#10b981] text-black font-bold px-3 py-2 rounded transition-colors">
                    Investir (USDT)
                </button>
            </div>
        `).addTo(map);
    }
});

// ==========================================
// PROJETOS EM CONSTRUÇÃO (EXPANSÃO DA REDE)
// ==========================================

const usinasEmConstrucao = [
    { nome: "Nova Usina - Palmas, TO", lat: -10.1843, lng: -48.3000, cap: "12 MW", prog: "45%" },
    { nome: "Polo Solar - Petrolina, PE", lat: -9.3883, lng: -40.5019, cap: "25 MW", prog: "15%" },
    { nome: "Parque Eólico - Cascavel, PR", lat: -24.9573, lng: -53.4590, cap: "18 MW", prog: "70%" },
    { nome: "Usina Tapajós - Santarém, PA", lat: -2.4430, lng: -54.7083, cap: "5 MW", prog: "30%" },
    { nome: "Solar Sul - Blumenau, SC", lat: -26.9194, lng: -49.0661, cap: "8 MW", prog: "80%" },
    { nome: "Complexo Norte - Macapá, AP", lat: 0.0389, lng: -51.0664, cap: "15 MW", prog: "5%" },
    { nome: "Usina Cerrado - Campo Grande, MS", lat: -20.4428, lng: -54.6464, cap: "20 MW", prog: "50%" }
];

usinasEmConstrucao.forEach(usina => {
    L.marker([usina.lat - 0.05, usina.lng - 0.05], {icon: usinaConstrucaoIcon}).bindPopup(`
        <div class="text-center p-1 w-48">
            <h4 class="font-bold text-lg mb-1">${usina.nome}</h4>
            <span class="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded border border-orange-500/50 inline-block mb-2">⧗ Em Construção (${usina.prog})</span>
            <p class="text-[11px] text-gray-300 mb-3">Capacidade Prevista: ${usina.cap}</p>
            <button onclick="window.openMapInvestModal('Construção em ${usina.nome.split('-')[1].trim()}')" class="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded transition-colors">
                Financiar (USDT)
            </button>
        </div>
    `).addTo(map);
});

const eletropostosEmConstrucao = [
    { nome: "Bauru, SP", lat: -22.3145, lng: -49.0587 },
    { nome: "Franca, SP", lat: -20.5386, lng: -47.4008 },
    { nome: "Uberlândia, MG", lat: -18.9113, lng: -48.2622 },
    { nome: "Joinville, SC", lat: -26.3045, lng: -48.8464 }
];

eletropostosEmConstrucao.forEach((eletro, idx) => {
    L.marker([eletro.lat - 0.02, eletro.lng - 0.02], {icon: chargerConstrucaoIcon}).bindPopup(`
        <div class="text-center p-1 w-36">
            <b class="text-sm">Novo Eletroposto (Obras)</b><br>
            <span class="text-[10px] text-orange-300">${eletro.nome}</span><br>
            <span class="text-[10px] text-gray-400 block mb-2">Fase de Instalação</span>
            <button onclick="window.openMapInvestModal('Hardware em ${eletro.nome}')" class="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded w-full transition-colors">
                Patrocinar Nó (USDT)
            </button>
        </div>
    `).addTo(map);
});


// ==========================================
// PINGS E ANIMAÇÕES EM TEMPO REAL (PULSOS GLOBAIS)
// ==========================================
const pulseIcon = L.divIcon({
    className: "map-pulse",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

setInterval(() => {
    if (typeof map === "undefined") return;
    
    const randomCity = cidadesBrasileiras[Math.floor(Math.random() * cidadesBrasileiras.length)];
    const lat = randomCity.lat + (Math.random() - 0.5) * 0.5;
    const lng = randomCity.lng - (Math.random() * 0.5); // Sempre negativo pra manter na terra firme
    
    const pulseMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
    
    const events = [
        "Novo Hardware IoT Ativado",
        "Fazenda Solar Injetando Energia",
        "Transação DePIN Validada",
        "Certificado Verde Emitido",
        "P2P Trade (200 kWh)",
        "Nova Estação de Recarga"
    ];
    const eventMsg = events[Math.floor(Math.random() * events.length)];
    
    pulseMarker.bindTooltip("<span style=\"color: #14F195; font-weight: bold; font-size: 10px;\">" + eventMsg + "</span>", {
        permanent: true,
        direction: "top",
        className: "bg-black/80 border border-[#14F195]/30 rounded-lg p-1"
    });
    
    setTimeout(() => {
        if (map.hasLayer(pulseMarker)) {
            map.removeLayer(pulseMarker);
        }
    }, 4000);
    
}, 3000);

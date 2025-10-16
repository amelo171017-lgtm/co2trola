const CONFIG = {
    METEOBLUE: {
    API_KEY: 'wXeysgtC0khLvfji',
    API_URL: 'https://my.meteoblue.com/packages',
    PACKAGES: {
        AIR_QUALITY: 'airquality-1h',
        BASIC: 'basic-1h',
		BASIC: 'basic-day',
        CURRENT: 'current'
    }
},
    
    MEASUREMENT: {
        MIN_DURATION: 30000,
        MAX_DURATION: 90000,
        CONFIDENCE_THRESHOLD: 75
    },
    
    REGIONS: {
        'centro': { 
            lat: -23.5505, 
            lon: -46.6333,
            name: 'Centro (Sé, República)',
            elevation: 760
        },
        'zona-sul': { 
            lat: -23.6500, 
            lon: -46.6400,
            name: 'Zona Sul',
            elevation: 780
        },
        'zona-leste': { 
            lat: -23.5500, 
            lon: -46.5000,
            name: 'Zona Leste',
            elevation: 720
        },
        'zona-oeste': { 
            lat: -23.5500, 
            lon: -46.7000,
            name: 'Zona Oeste',
            elevation: 800
        },
        'zona-norte': { 
            lat: -23.5000, 
            lon: -46.6000,
            name: 'Zona Norte',
            elevation: 750
        },
        'abc': { 
            lat: -23.6664, 
            lon: -46.5322,
            name: 'ABC Paulista',
            elevation: 760
        }
    },
    
    INDEX_CATALOG: [
        {
            name: "Excelente",
            color: "#00d4aa",
            level: "excelente",
            aqiRange: [0, 20],
            confidence: [85, 100],
            tips: [
                "Mantenha ventilação natural - padrão CETESB atendido",
                "Plantas saudáveis ajudam no conforto - comum em bairros como Jardins",
                "Evite fontes de fumaça para manter a qualidade"
            ]
        },
        {
            name: "Boa",
            color: "#2ecc71",
            level: "boa",
            aqiRange: [21, 40],
            confidence: [70, 84],
            tips: [
                "Abra janelas periodicamente - especialmente em regiões centrais",
                "Hidrate-se bem - o ar está dentro dos padrões paulistanos",
                "Limpeza leve e regular mantém o ambiente saudável"
            ]
        },
        {
            name: "Moderada",
            color: "#f1c40f",
            level: "moderada",
            aqiRange: [41, 60],
            confidence: [55, 69],
            tips: [
                "Aumente a ventilação - comum em áreas como República",
                "Evite produtos com odor forte - típico de regiões comerciais",
                "Reduza aglomeração no ambiente - cuidado em espaços pequenos"
            ]
        },
        {
            name: "Ruim",
            color: "#e67e22",
            level: "ruim",
            aqiRange: [61, 80],
            confidence: [40, 54],
            tips: [
                "Ventile imediatamente - similar a áreas próximas à Marginal",
                "Use exaustores/ventiladores - importante na Zona Leste",
                "Interrompa fontes de poluição (fumaça, produtos químicos) - atenção no Centro"
            ]
        },
        {
            name: "Muito Ruim",
            color: "#e74c3c",
            level: "muito-ruim",
            aqiRange: [81, 100],
            confidence: [0, 39],
            tips: [
                "Saia do local se possível - qualidade similar à região da Sé em horário de pico",
                "Aumente drasticamente a renovação de ar - urgente em ambientes fechados",
                "Considere purificador com filtro HEPA - recomendado para toda São Paulo"
            ]
        }
    ]
};

const USER_SETTINGS = {
    weatherData: true,
    aqAlerts: true,
    region: 'centro',
    lastMeasurement: null,
    useMeteoblueAPI: true
};

function saveSettings() {
    localStorage.setItem('CO2ntrola_settings', JSON.stringify(USER_SETTINGS));
}

function loadSettings() {
    const saved = localStorage.getItem('CO2ntrola_settings');
    if (saved) {
        Object.assign(USER_SETTINGS, JSON.parse(saved));
    }
}

loadSettings();
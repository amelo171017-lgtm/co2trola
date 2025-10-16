
class CO2ntrolaApp {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            this.setCurrentYear();
            
            if (USER_SETTINGS.weatherData && USER_SETTINGS.useMeteoblueAPI !== false) {
                await meteoblueService.initialize();
                
                if (meteoblueService.externalData && window.canvasBackground) {
                    window.canvasBackground.updateBasedOnAirQuality(meteoblueService.externalData.aqi);
                }
            }
            
            setInterval(() => {
                if (USER_SETTINGS.weatherData && USER_SETTINGS.useMeteoblueAPI !== false) {
                    meteoblueService.fetchMeteoblueData().then(() => {
                        meteoblueService.updateExternalDataDisplay();
                        
                        if (meteoblueService.externalData && window.canvasBackground) {
                            window.canvasBackground.updateBasedOnAirQuality(meteoblueService.externalData.aqi);
                        }
                    });
                }
            }, 30 * 60 * 1000);
            
            this.checkPreviousMeasurement();
            
            this.initialized = true;
            console.log('CO2ntrola app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setCurrentYear() {
        const yearElement = document.getElementById('year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    checkPreviousMeasurement() {
        if (USER_SETTINGS.lastMeasurement) {
            console.log('Previous measurement found:', USER_SETTINGS.lastMeasurement);
        }
    }

    getAppInfo() {
        return {
            name: 'CO2ntrola',
            version: '1.1.0',
            focus: 'São Paulo',
            features: ['Canvas Background', 'Meteoblue API Integration'],
            lastUpdate: '2025'
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.CO2ntrolaApp = new CO2ntrolaApp();
});
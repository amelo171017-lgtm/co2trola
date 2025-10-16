class WeatherService {
    constructor() {
        this.currentWeather = null;
        this.externalAQI = null;
        this.lastUpdate = null;
    }

    async fetchWeatherData() {
        if (!USER_SETTINGS.weatherData) return null;

        try {
            const region = CONFIG.REGIONS[USER_SETTINGS.region];
            const response = await fetch(
                `${CONFIG.WEATHER_API_URL}/weather?lat=${region.lat}&lon=${region.lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=pt_br`
            );
            
            if (!response.ok) throw new Error('Weather API error');
            
            const data = await response.json();
            this.currentWeather = {
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                city: data.name
            };
            
            this.lastUpdate = new Date();
            return this.currentWeather;
        } catch (error) {
            console.error('Error fetching weather:', error);
            return this.getFallbackWeather();
        }
    }

    async fetchExternalAQI() {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const region = USER_SETTINGS.region;
            const hour = new Date().getHours();
            
            let baseAQI;
            if (hour >= 7 && hour <= 9) baseAQI = 75;
            else if (hour >= 17 && hour <= 19) baseAQI = 85;
            else if (hour >= 12 && hour <= 14) baseAQI = 65;
            else baseAQI = 55;
            
            const regionModifiers = {
                'centro': 25,
                'zona-sul': -5,
                'zona-leste': 15,
                'zona-oeste': 0,
                'zona-norte': 10,
                'abc': 20
            };
            
            this.externalAQI = Math.max(0, Math.min(100, baseAQI + regionModifiers[region]));
            return this.externalAQI;
            
        } catch (error) {
            console.error('Error fetching AQI:', error);
            this.externalAQI = 65;
            return this.externalAQI;
        }
    }

    getFallbackWeather() {
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        
        this.currentWeather = {
            temp: 22,
            humidity: 65,
            description: isDay ? 'Parcialmente nublado' : 'Céu limpo',
            icon: isDay ? '02d' : '01n',
            city: 'São Paulo'
        };
        
        return this.currentWeather;
    }

    updateWeatherDisplay() {
        if (!this.currentWeather) return;

        const badge = document.getElementById('weather-badge');
        const tempEl = document.getElementById('weather-temp');
        const iconEl = document.getElementById('weather-icon');
        
        if (tempEl && iconEl) {
            tempEl.textContent = `${this.currentWeather.temp}°`;
            iconEl.src = `https://openweathermap.org/img/wn/${this.currentWeather.icon}.png`;
            iconEl.alt = this.currentWeather.description;
            badge.classList.remove('hidden');
        }
    }

    updateStatsDisplay() {
        const aqiEl = document.getElementById('external-aqi');
        const humidityEl = document.getElementById('humidity');
        const updateEl = document.getElementById('last-update');
        
        if (aqiEl && this.externalAQI) {
            aqiEl.textContent = this.externalAQI;
            aqiEl.style.color = this.getAQIColor(this.externalAQI);
        }
        
        if (humidityEl && this.currentWeather) {
            humidityEl.textContent = `${this.currentWeather.humidity}%`;
        }
        
        if (updateEl && this.lastUpdate) {
            updateEl.textContent = this.lastUpdate.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    getAQIColor(aqi) {
        if (aqi >= 80) return '#e74c3c';
        if (aqi >= 60) return '#e67e22';
        if (aqi >= 40) return '#f1c40f';
        if (aqi >= 20) return '#2ecc71';
        return '#00d4aa';
    }

    async initialize() {
        if (USER_SETTINGS.weatherData) {
            await this.fetchWeatherData();
            await this.fetchExternalAQI();
            this.updateWeatherDisplay();
            this.updateStatsDisplay();
        }
    }
}

const weatherService = new WeatherService();
class MeteoblueService {
    constructor() {
        this.externalData = null;
        this.lastUpdate = null;
        this.isLoading = false;
    }

    buildApiUrl(regionKey) {
        const region = CONFIG.REGIONS[regionKey];
        
        return `https://my.meteoblue.com/packages/basic-1h_air-1h_airquality-1h?apikey=${CONFIG.METEOBLUE.API_KEY}&lat=${region.lat}&lon=${region.lon}&asl=${region.elevation}&format=json`;
    }

    async fetchMeteoblueData(regionKey = USER_SETTINGS.region) {
        if (!USER_SETTINGS.useMeteoblueAPI || !CONFIG.METEOBLUE.API_KEY || CONFIG.METEOBLUE.API_KEY === 'DEMO_KEY') {
            console.log('Meteoblue API disabled or using demo key, using mock data');
            return this.getMockData(regionKey);
        }

        if (this.isLoading) {
            console.log('Meteoblue API request already in progress');
            return null;
        }

        this.isLoading = true;

        try {

            const apiUrl = this.buildApiUrl(regionKey); // REMOVIDO o segundo parâmetro
            console.log('Fetching Meteoblue data from:', apiUrl);

            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Meteoblue API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const processedData = this.processMeteoblueData(data, regionKey);
            
            this.isLoading = false;
            return processedData;

        } catch (error) {
            console.error('Error fetching Meteoblue data:', error);
            this.isLoading = false;
            
            return this.getMockData(regionKey);
        }
    }

    processMeteoblueData(data, regionKey) {
        try {
            const region = CONFIG.REGIONS[regionKey];
            const currentTime = new Date();
            
            let aqi = 50; //
            let pm25 = 15;
            let pm10 = 25;
            let humidity = 65;
            let temperature = 22;

            if (data.data_1h && data.data_1h.airqualityindex) {
                const aqiValues = data.data_1h.airqualityindex;
                aqi = aqiValues[aqiValues.length - 1] || aqi;
            }

            if (data.data_1h && data.data_1h.pm25_concentration) {
                const pm25Values = data.data_1h.pm25_concentration;
                pm25 = pm25Values[pm25Values.length - 1] || pm25;
            }

            if (data.data_1h && data.data_1h.pm10_concentration) {
                const pm10Values = data.data_1h.pm10_concentration;
                pm10 = pm10Values[pm10Values.length - 1] || pm10;
            }

            if (data.data_1h && data.data_1h.relativehumidity) {
                const humidityValues = data.data_1h.relativehumidity;
                humidity = humidityValues[humidityValues.length - 1] || humidity;
            }

            if (data.data_1h && data.data_1h.temperature) {
                const tempValues = data.data_1h.temperature;
                temperature = tempValues[tempValues.length - 1] || temperature;
            }

            let conditions = "Parcialmente nublado";
            let isDaylight = true;
            
            if (data.data_current) {
                const hour = currentTime.getHours();
                isDaylight = hour >= 6 && hour < 18;
                conditions = this.getWeatherCondition(data.data_current.pictocode, isDaylight);
            }

            this.externalData = {
                aqi: Math.round(aqi),
                pm25: Math.round(pm25),
                pm10: Math.round(pm10),
                humidity: Math.round(humidity),
                temperature: Math.round(temperature),
                conditions: conditions,
                isDaylight: isDaylight,
                region: region.name,
                lastUpdate: currentTime,
                source: 'meteoblue',
                metadata: data.metadata || {}
            };

            this.lastUpdate = currentTime;
            
            console.log('Meteoblue data processed:', this.externalData);
            return this.externalData;

        } catch (error) {
            console.error('Error processing Meteoblue data:', error);
            return this.getMockData(regionKey);
        }
    }

    getWeatherCondition(pictocode, isDaylight) {
        const conditions = {
            1: isDaylight ? "Céu limpo" : "Céu limpo",
            2: "Parcialmente nublado",
            3: "Nublado",
            4: "Chuva fraca",
            5: "Chuva moderada",
            6: "Chuva forte",
            7: "Tempestade",
            8: "Neve",
            9: "Neblina"
        };
        
        return conditions[pictocode] || "Condições desconhecidas";
    }

    getMockData(regionKey) {
        const region = CONFIG.REGIONS[regionKey];
        const currentTime = new Date();
        const hour = currentTime.getHours();
        
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        const isDaylight = hour >= 6 && hour < 18;
        
        let baseAQI = 50;
        let baseTemp = 22;
        let baseHumidity = 65;
        
        const regionModifiers = {
            'centro': { aqi: 20, temp: 2, humidity: -5 },
            'zona-sul': { aqi: -10, temp: -1, humidity: 5 },
            'zona-leste': { aqi: 15, temp: 1, humidity: -3 },
            'zona-oeste': { aqi: -5, temp: -2, humidity: 8 },
            'zona-norte': { aqi: 10, temp: 0, humidity: 0 },
            'abc': { aqi: 25, temp: 1, humidity: -2 }
        };
        
        const modifier = regionModifiers[regionKey] || { aqi: 0, temp: 0, humidity: 0 };
        
        if (isRushHour) baseAQI += 15;
        
        if (hour >= 22 || hour <= 5) {
            baseTemp -= 5;
            baseHumidity += 10;
        }
        
        const randomAQI = Math.random() * 20 - 10;
        const randomTemp = Math.random() * 4 - 2;
        const randomHumidity = Math.random() * 10 - 5;
        
        const finalAQI = Math.max(0, Math.min(100, baseAQI + modifier.aqi + randomAQI));
        const finalTemp = baseTemp + modifier.temp + randomTemp;
        const finalHumidity = Math.max(30, Math.min(90, baseHumidity + modifier.humidity + randomHumidity));
        
        this.externalData = {
            aqi: Math.round(finalAQI),
            pm25: Math.round(finalAQI * 0.3 + 5),
            pm10: Math.round(finalAQI * 0.5 + 10),
            humidity: Math.round(finalHumidity),
            temperature: Math.round(finalTemp),
            conditions: isDaylight ? "Parcialmente nublado" : "Céu limpo",
            isDaylight: isDaylight,
            region: region.name,
            lastUpdate: currentTime,
            source: 'mock',
            metadata: { name: region.name }
        };
        
        this.lastUpdate = currentTime;
        return this.externalData;
    }

    getAirQualityLevel(aqi) {
        return CONFIG.INDEX_CATALOG.find(level => 
            aqi >= level.aqiRange[0] && aqi <= level.aqiRange[1]
        ) || CONFIG.INDEX_CATALOG[2];
    }

    getAQIColor(aqi) {
        const level = this.getAirQualityLevel(aqi);
        return level ? level.color : '#f1c40f';
    }

    getAQIDescription(aqi) {
        const level = this.getAirQualityLevel(aqi);
        return level ? level.name : 'Moderada';
    }

    updateExternalDataDisplay() {
        if (!this.externalData) return;

        const aqiEl = document.getElementById('external-aqi');
        if (aqiEl) {
            aqiEl.textContent = this.externalData.aqi;
            aqiEl.style.color = this.getAQIColor(this.externalData.aqi);
        }

        const humidityEl = document.getElementById('humidity');
        if (humidityEl) {
            humidityEl.textContent = `${this.externalData.humidity}%`;
        }

        const updateEl = document.getElementById('last-update');
        if (updateEl && this.lastUpdate) {
            updateEl.textContent = this.lastUpdate.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        this.updateWeatherBadge();
    }

    updateWeatherBadge() {
        const badge = document.getElementById('weather-badge');
        const tempEl = document.getElementById('weather-temp');
        
        if (badge && tempEl && this.externalData) {
            tempEl.textContent = `${this.externalData.temperature}°`;
            badge.classList.remove('hidden');
        }
    }

    getExternalRecommendations(aqi) {
        const level = this.getAirQualityLevel(aqi);
        const recommendations = [];
        
        if (aqi >= 60) {
            recommendations.push("💨 Evite atividades ao ar livre");
            recommendations.push("🏠 Mantenha janelas fechadas");
            recommendations.push("🌿 Use purificador de ar se possível");
        } else if (aqi >= 40) {
            recommendations.push("🌤️ Qualidade moderada - bom para atividades externas");
            recommendations.push("🏡 Ventile ambientes pela manhã");
        } else {
            recommendations.push("🌞 Excelente qualidade do ar externa");
            recommendations.push("🪟 Aproveite para ventilar os ambientes");
        }
        
        return recommendations;
    }

    async initialize() {
        if (USER_SETTINGS.weatherData) {
            await this.fetchMeteoblueData();
            this.updateExternalDataDisplay();
        }
    }
}

const meteoblueService = new MeteoblueService();
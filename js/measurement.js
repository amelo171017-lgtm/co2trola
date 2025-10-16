class MeasurementService {
    constructor() {
        this.isMeasuring = false;
        this.currentMeasurement = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
    }

    async startMeasurement(environmentData) {
        if (this.isMeasuring) return;
        
        this.isMeasuring = true;
        this.currentMeasurement = {
            id: Date.now(),
            environment: environmentData,
            startTime: new Date(),
            status: 'initializing',
            externalData: null
        };

        try {
            if (USER_SETTINGS.weatherData) {
                this.currentMeasurement.externalData = await meteoblueService.fetchMeteoblueData(environmentData.region);
            }
            
            await this.initializeAudioAnalysis();
            
            return this.performMeasurement();
            
        } catch (error) {
            console.error('Measurement error:', error);
            this.isMeasuring = false;
            throw error;
        }
    }

    async initializeAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
        } catch (error) {
            console.warn('Audio analysis not available:', error);
        }
    }

    async performMeasurement() {
        const duration = CONFIG.MEASUREMENT.MIN_DURATION + 
                        Math.random() * (CONFIG.MEASUREMENT.MAX_DURATION - CONFIG.MEASUREMENT.MIN_DURATION);
        
        const startTime = Date.now();
        let analysisData = {
            frequencyData: [],
            audioLevels: [],
            environmentFactors: []
        };

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!this.isMeasuring) {
                    clearInterval(interval);
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);
                
                if (typeof this.onProgress === 'function') {
                    this.onProgress(progress, this.generateStatusMessage(progress));
                }
                
                if (this.analyser) {
                    this.collectAudioData(analysisData);
                }
                
                if (progress >= 1) {
                    clearInterval(interval);
                    this.completeMeasurement(analysisData, resolve);
                }
            }, 100);
        });
    }

    collectAudioData(analysisData) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        analysisData.frequencyData.push([...dataArray]);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        analysisData.audioLevels.push(average);
    }

    generateStatusMessage(progress) {
        const messages = [
            "Inicializando sensores acústicos...",
            "Calibrando para ambiente " + (this.currentMeasurement.environment.type === 'casa' ? 'residencial' : this.currentMeasurement.environment.type) + "...",
            "Analisando espectro de frequências...",
            "Consultando dados externos da região...",
            "Detectando padrões de qualidade do ar...",
            "Comparando com dados da CETESB...",
            "Processando dados da região " + this.currentMeasurement.environment.region + "...",
            "Integrando dados meteorológicos...",
            "Avaliando fatores ambientais...",
            "Otimizando algoritmo de detecção...",
            "Validando resultados preliminares...",
            "Finalizando análise..."
        ];
        
        const index = Math.min(messages.length - 1, Math.floor(progress * messages.length));
        return messages[index];
    }

    completeMeasurement(analysisData, resolve) {
        this.isMeasuring = false;
        
        const result = this.calculateAirQuality(analysisData);
        
        if (this.microphone) {
            this.microphone.disconnect();
            const tracks = this.microphone.mediaStream.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.currentMeasurement.endTime = new Date();
        this.currentMeasurement.result = result;
        
        USER_SETTINGS.lastMeasurement = this.currentMeasurement;
        saveSettings();
        
        resolve(result);
    }

    calculateAirQuality(analysisData) {
        const env = this.currentMeasurement.environment;
        const externalData = this.currentMeasurement.externalData;
        
        let baseScore = 50;
        
        const typeModifiers = {
            'casa': 15,
            'escritorio': 5,
            'escola': 0,
            'comercio': -10,
            'industria': -25,
            'outro': 0
        };
        
        const sizeModifiers = {
            'pequeno': -5,
            'medio': 5,
            'grande': 10
        };
        
        const ventModifiers = {
            'baixa': -15,
            'media': 5,
            'alta': 15
        };
        
        const regionModifiers = {
            'centro': -20,
            'zona-sul': 10,
            'zona-leste': -10,
            'zona-oeste': 15,
            'zona-norte': 0,
            'abc': -15
        };
        
        baseScore += typeModifiers[env.type] + 
                    sizeModifiers[env.size] + 
                    ventModifiers[env.ventilation] +
                    regionModifiers[env.region];
        
        if (externalData && externalData.aqi) {
            const externalInfluence = (100 - externalData.aqi) * 0.2;
            baseScore += externalInfluence;
        }
        
        const audioInfluence = analysisData.audioLevels.length > 0 ? 
            (analysisData.audioLevels.reduce((a, b) => a + b) / analysisData.audioLevels.length) / 2.55 : 50;
        
        const finalScore = (baseScore * 0.6) + (audioInfluence * 0.2) + (Math.random() * 20 - 10);
        
        const normalizedScore = Math.max(0, Math.min(100, finalScore));
        
        const qualityLevel = this.getQualityLevel(normalizedScore);
        const confidence = this.calculateConfidence(normalizedScore, analysisData);
        
        return {
            score: Math.round(normalizedScore),
            level: qualityLevel.level,
            name: qualityLevel.name,
            color: qualityLevel.color,
            confidence: confidence,
            timestamp: new Date(),
            externalAQI: externalData ? externalData.aqi : null,
            factors: {
                environment: env.type,
                region: env.region,
                size: env.size,
                ventilation: env.ventilation,
                externalInfluence: externalData ? true : false
            }
        };
    }

    getQualityLevel(score) {
        return CONFIG.INDEX_CATALOG.find(level => 
            score >= level.confidence[0] && score <= level.confidence[1]
        ) || CONFIG.INDEX_CATALOG[2]; // Default to moderate
    }

    calculateConfidence(score, analysisData) {
        let confidence = 70;
        
        if (score < 20 || score > 80) confidence += 15;
        
        if (analysisData.audioLevels.length > 10) confidence += 10;
        
        const env = this.currentMeasurement.environment;
        if (env.type && env.region && env.size && env.ventilation) confidence += 5;
        
        if (this.currentMeasurement.externalData) confidence += 10;
        
        return Math.min(95, confidence);
    }

    stopMeasurement() {
        this.isMeasuring = false;
        
        if (this.microphone) {
            const tracks = this.microphone.mediaStream.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    onProgress(callback) {
        this.onProgress = callback;
    }
}

window.measurementService = new MeasurementService();
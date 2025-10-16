class UIManager {
    constructor() {
        this.currentView = 'main';
        this.elements = {};
        this.initializeElements();
        this.bindEvents();
        console.log('UIManager initialized successfully');
    }

    initializeElements() {
        const elementIds = [
            'modal', 'settings-modal',
            
            'btn-open-modal', 'btn-cancel', 'btn-start', 'btn-new', 
            'btn-save', 'btn-settings', 'btn-close-settings',
            
            'measuring', 'result', 'progress-bar', 'progress-percent', 
            'measure-status', 'sensors-active', 'confidence-level',
            
            'result-title', 'result-tips', 'result-location', 
            'result-time', 'result-confidence',
            
            'city-region', 'environment-type', 'room-size', 'ventilation',
            
            'weather-data', 'aq-alerts', 'use-meteoblue'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    bindEvents() {
        this.safeAddEventListener(this.elements['btn-open-modal'], 'click', () => this.openModal());
        this.safeAddEventListener(this.elements['btn-cancel'], 'click', () => this.closeModal());
        this.safeAddEventListener(this.elements['btn-start'], 'click', () => this.startMeasurement());
        this.safeAddEventListener(this.elements['btn-new'], 'click', () => this.showMainView());
        this.safeAddEventListener(this.elements['btn-save'], 'click', () => this.saveResult());
        
        this.safeAddEventListener(this.elements['btn-settings'], 'click', () => this.openSettings());
        this.safeAddEventListener(this.elements['btn-close-settings'], 'click', () => this.closeSettings());
        
        this.safeAddEventListener(this.elements['weather-data'], 'change', (e) => {
            USER_SETTINGS.weatherData = e.target.checked;
            saveSettings();
            if (e.target.checked && window.meteoblueService) {
                meteoblueService.initialize();
            } else {
                const badge = document.getElementById('weather-badge');
                if (badge) badge.classList.add('hidden');
            }
        });
        
        this.safeAddEventListener(this.elements['aq-alerts'], 'change', (e) => {
            USER_SETTINGS.aqAlerts = e.target.checked;
            saveSettings();
        });

        this.safeAddEventListener(this.elements['use-meteoblue'], 'change', (e) => {
            USER_SETTINGS.useMeteoblueAPI = e.target.checked;
            saveSettings();
            if (e.target.checked && USER_SETTINGS.weatherData && window.meteoblueService) {
                meteoblueService.initialize();
            }
        });
        
        this.safeAddEventListener(this.elements['city-region'], 'change', (e) => {
            USER_SETTINGS.region = e.target.value;
            saveSettings();
            if (USER_SETTINGS.weatherData && window.meteoblueService) {
                meteoblueService.fetchMeteoblueData(e.target.value).then(() => {
                    meteoblueService.updateExternalDataDisplay();
                });
            }
        });
        
        this.loadSettingsIntoForm();
    }

    safeAddEventListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element not found for event: ${event}`);
        }
    }

    openModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('hidden');
            this.updateFormWithLastSettings();
        }
    }

    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
        }
    }

    openSettings() {
        if (this.elements['settings-modal']) {
            this.elements['settings-modal'].classList.remove('hidden');
        }
    }

    closeSettings() {
        if (this.elements['settings-modal']) {
            this.elements['settings-modal'].classList.add('hidden');
        }
    }

    loadSettingsIntoForm() {
        if (this.elements['weather-data']) {
            this.elements['weather-data'].checked = USER_SETTINGS.weatherData;
        }
        if (this.elements['aq-alerts']) {
            this.elements['aq-alerts'].checked = USER_SETTINGS.aqAlerts;
        }
        if (this.elements['use-meteoblue']) {
            this.elements['use-meteoblue'].checked = USER_SETTINGS.useMeteoblueAPI !== false;
        }
        if (this.elements['city-region']) {
            this.elements['city-region'].value = USER_SETTINGS.region;
        }
    }

    updateFormWithLastSettings() {
        if (USER_SETTINGS.lastMeasurement && this.elements['environment-type'] && this.elements['room-size'] && this.elements['ventilation']) {
            const last = USER_SETTINGS.lastMeasurement.environment;
            this.elements['environment-type'].value = last.type;
            this.elements['room-size'].value = last.size;
            this.elements['ventilation'].value = last.ventilation;
        }
    }

    async startMeasurement() {
        if (!this.elements['environment-type'] || !this.elements['city-region'] || !this.elements['room-size'] || !this.elements['ventilation']) {
            this.showError('Erro: formulário incompleto');
            return;
        }

        const environmentData = {
            type: this.elements['environment-type'].value,
            region: this.elements['city-region'].value,
            size: this.elements['room-size'].value,
            ventilation: this.elements['ventilation'].value
        };

        USER_SETTINGS.region = environmentData.region;
        saveSettings();

        this.closeModal();
        this.showMeasuringView();

        try {
            if (window.measurementService) {
                window.measurementService.onProgress((progress, status) => {
                    this.updateProgress(progress, status);
                });

                const result = await window.measurementService.startMeasurement(environmentData);
                
                this.showResultView(result);
            } else {
                this.showError('Serviço de medição não disponível');
            }
            
        } catch (error) {
            console.error('Measurement failed:', error);
            this.showError('Falha na medição. Tente novamente.');
        }
    }

    updateProgress(progress, status) {
        const percent = Math.round(progress * 100);
        
        if (this.elements['progress-bar']) {
            this.elements['progress-bar'].style.width = `${percent}%`;
        }
        if (this.elements['progress-percent']) {
            this.elements['progress-percent'].textContent = `${percent}%`;
        }
        if (this.elements['measure-status']) {
            this.elements['measure-status'].textContent = status;
        }
        
        const activeSensors = Math.min(5, 3 + Math.floor(progress * 2));
        if (this.elements['sensors-active']) {
            this.elements['sensors-active'].textContent = `${activeSensors}/5`;
        }
        
        const confidence = Math.min(95, 70 + Math.floor(progress * 25));
        if (this.elements['confidence-level']) {
            this.elements['confidence-level'].textContent = `${confidence}%`;
        }
    }

    showMeasuringView() {
        this.hideAllViews();
        if (this.elements.measuring) {
            this.elements.measuring.classList.remove('hidden');
        }
        this.currentView = 'measuring';
    }

    showResultView(result) {
        this.hideAllViews();
        if (this.elements.result) {
            this.elements.result.classList.remove('hidden');
        }
        this.currentView = 'result';
        
        if (this.elements['result-title']) {
            this.elements['result-title'].textContent = result.name;
            this.elements['result-title'].style.setProperty('--result-color', result.color);
        }
        if (this.elements['result-confidence']) {
            this.elements['result-confidence'].textContent = `${result.confidence}%`;
        }
        if (this.elements['result-location']) {
            this.elements['result-location'].textContent = this.getRegionName(result.factors.region);
        }
        
        const externalData = window.measurementService && window.measurementService.currentMeasurement ? 
            window.measurementService.currentMeasurement.externalData : null;
        this.updateTips(result, externalData);
    }

    showMainView() {
        this.hideAllViews();
        this.currentView = 'main';
    }

    showError(message) {
        alert(message);
        this.showMainView();
    }

    hideAllViews() {
        if (this.elements.measuring) {
            this.elements.measuring.classList.add('hidden');
        }
        if (this.elements.result) {
            this.elements.result.classList.add('hidden');
        }
    }

    updateTips(result, externalData) {
        const levelData = CONFIG.INDEX_CATALOG.find(item => item.level === result.level);
        if (this.elements['result-tips']) {
            this.elements['result-tips'].innerHTML = '';
        } else {
            return;
        }
        
        let tips = [];
        
        if (levelData && levelData.tips) {
            tips = [...levelData.tips];
        }
        
        if (externalData && externalData.aqi && window.meteoblueService) {
            const externalTips = meteoblueService.getExternalRecommendations(externalData.aqi);
            tips = [...externalTips, ...tips];
        }
        
        const displayTips = tips.slice(0, 3);
        
        displayTips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            this.elements['result-tips'].appendChild(li);
        });
    }

    saveResult() {
        const result = USER_SETTINGS.lastMeasurement;
        if (result) {
            this.showNotification('Resultado salvo com sucesso!');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface);
            color: var(--ink);
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getRegionName(regionKey) {
        const regions = {
            'centro': 'Centro',
            'zona-sul': 'Zona Sul',
            'zona-leste': 'Zona Leste', 
            'zona-oeste': 'Zona Oeste',
            'zona-norte': 'Zona Norte',
            'abc': 'ABC Paulista'
        };
        return regions[regionKey] || 'São Paulo';
    }
}

window.uiManager = new UIManager();
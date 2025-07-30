// backtest/ui/rule-config-ui.js
// Dynamic UI builder for trading rules configuration

class RuleConfigUI {
    constructor() {
        this.ruleConfig = this.getDefaultConfig();
        this.validationErrors = [];
    }
    
    // Get default configuration from rule definitions
    getDefaultConfig() {
        const config = {};
        
        Object.keys(RULE_DEFINITIONS).forEach(category => {
            Object.keys(RULE_DEFINITIONS[category]).forEach(ruleId => {
                const rule = RULE_DEFINITIONS[category][ruleId];
                config[ruleId] = rule.defaultValue;
                
                // Handle input configurations
                if (rule.inputConfig) {
                    config[rule.inputConfig.id] = rule.inputConfig.defaultValue;
                }
            });
        });
        
        return config;
    }
    
    // Generate complete UI HTML
    generateUI() {
        return `
            <div class="simple-backtest-section">
                <h2>Simple Backtest Engine</h2>
                
                <div class="rule-configuration">
                    <h3>Trading Rules Configuration</h3>
                    
                    ${this.generateCategorySection('entry', 'Entry Rules')}
                    ${this.generateCategorySection('exit', 'Exit Rules')}
                    ${this.generateCategorySection('special', 'Special Features')}
                    
                    <div class="rule-controls">
                        <button id="resetRules">Reset to Defaults</button>
                        <button id="saveRules">Save Configuration</button>
                    </div>
                    
                    <div id="validationError" class="validation-error" style="display: none;"></div>
                </div>
                
                <div class="simple-backtest-controls">
                    <button id="runSimpleBacktest" class="btn-primary">Run Simple Backtest</button>
                    <button id="clearSimpleResults" class="btn-secondary">Clear Results</button>
                    <span id="backtestStatus" class="progress-indicator">Processing...</span>
                </div>
                
                <div id="simple-backtest-results">
                    <!-- Results will be inserted here -->
                </div>
            </div>
        `;
    }
    
    // Generate UI section for a category (entry/exit/special)
    generateCategorySection(category, title) {
        const rules = getRulesByCategory(category);
        
        return `
            <div class="rule-category">
                <h4>${title}</h4>
                ${Object.keys(rules).map(ruleId => this.generateRuleHTML(rules[ruleId])).join('')}
            </div>
        `;
    }
    
    // Generate HTML for individual rule
    generateRuleHTML(rule) {
        const isDisabled = !rule.implemented;
        const disabledClass = isDisabled ? 'disabled' : '';
        const disabledAttr = isDisabled ? 'disabled' : '';
        
        switch(rule.type) {
            case 'checkbox':
                return `
                    <div class="rule-item ${disabledClass}" data-rule-id="${rule.id}">
                        <input type="checkbox" id="${rule.id}" ${rule.defaultValue ? 'checked' : ''} ${disabledAttr}>
                        <label for="${rule.id}">${rule.label}</label>
                        ${!rule.implemented ? '<span class="not-implemented">(Not Implemented)</span>' : ''}
                        ${rule.description ? `<div class="rule-description">${rule.description}</div>` : ''}
                    </div>
                `;
                
            case 'checkbox-with-input':
                return `
                    <div class="rule-item ${disabledClass}" data-rule-id="${rule.id}">
                        <input type="checkbox" id="${rule.id}" ${rule.defaultValue ? 'checked' : ''} ${disabledAttr}>
                        <label for="${rule.id}">${rule.label}:</label>
                        ${this.generateInputHTML(rule.inputConfig, disabledAttr)}
                        ${!rule.implemented ? '<span class="not-implemented">(Not Implemented)</span>' : ''}
                        ${rule.description ? `<div class="rule-description">${rule.description}</div>` : ''}
                    </div>
                `;
                
            default:
                return '';
        }
    }
    
    // Generate input HTML for rules with inputs
    generateInputHTML(inputConfig, disabledAttr) {
        if (!inputConfig) return '';
        
        return `
            <div class="rule-input">
                <input type="${inputConfig.type}" 
                       id="${inputConfig.id}" 
                       value="${inputConfig.defaultValue}"
                       min="${inputConfig.min || ''}"
                       max="${inputConfig.max || ''}"
                       step="${inputConfig.step || ''}" 
                       ${disabledAttr}>
                <span>${inputConfig.suffix || ''}</span>
            </div>
        `;
    }
    
    // Initialize UI in DOM
    initializeUI() {
        // Find insertion point
        const controlsDiv = document.querySelector('.controls');
        if (!controlsDiv) {
            console.error('Could not find .controls div for UI insertion');
            return false;
        }
        
        // Create and insert UI
        const uiContainer = document.createElement('div');
        uiContainer.innerHTML = this.generateUI();
        controlsDiv.parentNode.insertBefore(uiContainer, controlsDiv.nextSibling);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved configuration
        this.loadConfiguration();
        
        console.log('Rule configuration UI initialized successfully');
        return true;
    }
    
    // Setup all event listeners
    setupEventListeners() {
        // Use event delegation for efficiency
        document.addEventListener('change', this.handleRuleChange.bind(this));
        document.addEventListener('input', this.handleRuleInput.bind(this));
        
        // Control buttons
        const resetBtn = document.getElementById('resetRules');
        const saveBtn = document.getElementById('saveRules');
        const runBtn = document.getElementById('runSimpleBacktest');
        const clearBtn = document.getElementById('clearSimpleResults');
        
        if (resetBtn) resetBtn.addEventListener('click', this.resetToDefaults.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.saveConfiguration.bind(this));
        if (runBtn) runBtn.addEventListener('click', this.handleRunBacktest.bind(this));
        if (clearBtn) clearBtn.addEventListener('click', this.handleClearResults.bind(this));
    }
    
    // Handle rule checkbox changes
    handleRuleChange(event) {
        if (event.target.type === 'checkbox' && event.target.closest('.rule-item')) {
            const ruleId = event.target.id;
            const value = event.target.checked;
            
            this.updateRuleConfiguration(ruleId, value);
            this.handleDependencies(ruleId, value);
            this.validateConfiguration();
        }
    }
    
    // Handle input changes
    handleRuleInput(event) {
        if (event.target.type === 'number' && event.target.closest('.rule-item')) {
            const inputId = event.target.id;
            const value = parseFloat(event.target.value);
            
            this.updateRuleConfiguration(inputId, value);
            this.validateInput(event.target);
            this.validateConfiguration();
        }
    }
    
    // Update rule configuration
    updateRuleConfiguration(ruleId, value) {
        this.ruleConfig[ruleId] = value;
        
        // Update global config for backtest engine
        if (window.ruleConfig) {
            window.ruleConfig[ruleId] = value;
        } else {
            window.ruleConfig = { ...this.ruleConfig };
        }
        
        console.log(`Rule ${ruleId} updated to:`, value);
    }
    
    // Handle rule dependencies
    handleDependencies(ruleId, enabled) {
        // Enable/disable dependent inputs
        if (ruleId === 'stopLoss') {
            const stopLossInput = document.getElementById('stopLossPercent');
            if (stopLossInput) {
                stopLossInput.disabled = !enabled;
            }
        }
        
        // TODO: Handle other dependencies as more rules are implemented
    }
    
    // Validate individual input
    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        
        if (isNaN(value) || value < min || value > max) {
            input.classList.add('error');
            return false;
        } else {
            input.classList.remove('error');
            return true;
        }
    }
    
    // Validate entire configuration
    validateConfiguration() {
        this.validationErrors = [];
        
        // Check entry rules
        const hasEntryRule = this.ruleConfig.entryLphLpl; // Only implemented entry rule
        if (!hasEntryRule) {
            this.validationErrors.push('At least one entry rule must be enabled');
        }
        
        // Check exit rules
        const hasStopLoss = this.ruleConfig.stopLoss && 
                           this.ruleConfig.stopLossPercent >= 0.1 && 
                           this.ruleConfig.stopLossPercent <= 5.0;
        const hasEodExit = this.ruleConfig.eodExit;
        const hasTrailingSpl = this.ruleConfig.trailingSpl;
        
        if (!hasStopLoss && !hasEodExit && !hasTrailingSpl) {
            this.validationErrors.push('At least one exit rule must be enabled with valid configuration');
        }
        
        // Validate stop loss percentage
        if (this.ruleConfig.stopLoss) {
            if (isNaN(this.ruleConfig.stopLossPercent) || 
                this.ruleConfig.stopLossPercent < 0.1 || 
                this.ruleConfig.stopLossPercent > 5.0) {
                this.validationErrors.push('Stop loss percentage must be between 0.1% and 5.0%');
            }
        }
        
        this.displayValidationErrors();
        return this.validationErrors.length === 0;
    }
    
    // Display validation errors
    displayValidationErrors() {
        const errorDiv = document.getElementById('validationError');
        const runButton = document.getElementById('runSimpleBacktest');
        
        if (this.validationErrors.length > 0) {
            errorDiv.innerHTML = this.validationErrors.join('<br>');
            errorDiv.style.display = 'block';
            if (runButton) runButton.disabled = true;
        } else {
            errorDiv.style.display = 'none';
            if (runButton) runButton.disabled = false;
        }
    }
    
    // Reset to default configuration
    resetToDefaults() {
        this.ruleConfig = this.getDefaultConfig();
        this.updateUIFromConfiguration();
        window.ruleConfig = { ...this.ruleConfig };
        console.log('Rules reset to defaults');
    }
    
    // Update UI elements from configuration
    updateUIFromConfiguration() {
        Object.keys(this.ruleConfig).forEach(ruleId => {
            const element = document.getElementById(ruleId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.ruleConfig[ruleId];
                } else if (element.type === 'number') {
                    element.value = this.ruleConfig[ruleId];
                }
            }
        });
        
        this.validateConfiguration();
    }
    
    // Save configuration to localStorage
    saveConfiguration() {
        try {
            localStorage.setItem('backtestRuleConfig', JSON.stringify(this.ruleConfig));
            
            // Visual feedback
            const saveButton = document.getElementById('saveRules');
            if (saveButton) {
                const originalText = saveButton.textContent;
                saveButton.textContent = 'Saved!';
                saveButton.style.background = '#28a745';
                setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.style.background = '';
                }, 1500);
            }
            
            console.log('Configuration saved to localStorage');
        } catch (error) {
            console.error('Failed to save configuration:', error);
        }
    }
    
    // Load configuration from localStorage
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('backtestRuleConfig');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                this.ruleConfig = { ...this.getDefaultConfig(), ...savedConfig };
                this.updateUIFromConfiguration();
                window.ruleConfig = { ...this.ruleConfig };
                console.log('Configuration loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.resetToDefaults();
        }
    }
    
    // Handle run backtest button
    handleRunBacktest() {
        if (!this.validateConfiguration()) {
            return;
        }
        
        // Check prerequisites
        if (!window.chartData || window.chartData.length === 0) {
            alert('Please form bars first by uploading CSV and clicking "Form Bars"');
            return;
        }
        
        if (!window.pivotData || (!window.pivotData.lph && !window.pivotData.lpl)) {
            alert('Please detect pivots first by clicking "Detect Pivots"');
            return;
        }
        
        // Check if backtest engine is available
        if (typeof window.runBacktest !== 'function') {
            alert('Backtest engine not loaded. Please refresh and try again.');
            return;
        }
        
        // Run backtest
        try {
            window.runBacktest();
        } catch (error) {
            console.error('Backtest error:', error);
            alert('Error running backtest: ' + error.message);
        }
    }
    
    // Handle clear results button
    handleClearResults() {
        // Clear all result displays
        const summaryDiv = document.getElementById('backtest-summary');
        const tableDiv = document.getElementById('trades-table-container');
        const statusDiv = document.getElementById('status');
        
        if (summaryDiv) summaryDiv.style.display = 'none';
        if (tableDiv) tableDiv.style.display = 'none';
        if (statusDiv) statusDiv.style.display = 'none';
        
        console.log('Results cleared');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for rule definitions to load
    setTimeout(() => {
        if (typeof RULE_DEFINITIONS !== 'undefined') {
            const ruleUI = new RuleConfigUI();
            ruleUI.initializeUI();
            
            // Make available globally
            window.ruleConfigUI = ruleUI;
        } else {
            console.error('RULE_DEFINITIONS not loaded');
        }
    }, 100);
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RuleConfigUI = RuleConfigUI;
}
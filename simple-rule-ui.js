// simple-rule-ui.js - ENHANCED VERSION WITH RULE CHECKBOXES
// Enhanced UI for the minimal backtesting system with rule configuration

// Global rule configuration
window.ruleConfig = {
    entryLphLpl: true,        // LPH/LPL break entry
    gapHandling: true,        // Gap handling logic
    stopLoss: true,           // Stop loss enabled/disabled
    stopLossPercent: 0.3,     // Stop loss percentage (user configurable)
    eodExit: true,            // End of day exit
    dailyReset: true          // Daily level reset
};

// Initialize UI components
function initializeSimpleBacktestUI() {
    console.log('Initializing Enhanced Simple Backtest UI...');
    
    // Add CSS styles
    addSimpleBacktestStyles();
    
    // Add UI elements to the existing page
    addSimpleBacktestUI();
    
    // Set up event listeners
    setupSimpleBacktestListeners();
    
    // Load saved configuration
    loadRuleConfiguration();
    
    console.log('Enhanced Simple Backtest UI initialized successfully');
}

// Add enhanced CSS styles for the backtest UI
function addSimpleBacktestStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .simple-backtest-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        
        .rule-configuration {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
        }
        
        .rule-configuration h3 {
            margin: 0 0 15px 0;
            color: #495057;
            font-size: 18px;
        }
        
        .rule-category {
            margin-bottom: 20px;
        }
        
        .rule-category h4 {
            margin: 0 0 10px 0;
            color: #6c757d;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .rule-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: white;
            border-radius: 5px;
            border: 1px solid #e9ecef;
        }
        
        .rule-item input[type="checkbox"] {
            margin-right: 10px;
            transform: scale(1.2);
        }
        
        .rule-item label {
            flex: 1;
            margin: 0;
            font-size: 14px;
            color: #495057;
            cursor: pointer;
        }
        
        .rule-item.disabled {
            opacity: 0.6;
            background: #f8f9fa;
        }
        
        .stop-loss-input {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
        }
        
        .stop-loss-input input[type="number"] {
            width: 60px;
            padding: 4px 8px;
            border: 1px solid #ced4da;
            border-radius: 3px;
            font-size: 14px;
            text-align: center;
        }
        
        .stop-loss-input input[type="number"]:disabled {
            background: #e9ecef;
            color: #6c757d;
        }
        
        .stop-loss-input input[type="number"].error {
            border-color: #dc3545;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        
        .stop-loss-input span {
            font-size: 14px;
            color: #6c757d;
        }
        
        .rule-controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
        }
        
        .rule-controls button {
            padding: 8px 16px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            background: white;
            color: #495057;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .rule-controls button:hover {
            background: #e9ecef;
        }
        
        .validation-error {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
            border: 1px solid #f5c6cb;
        }
        
        .simple-backtest-controls {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .simple-backtest-controls button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .simple-backtest-controls button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .simple-backtest-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-primary {
            background-color: #3498db;
            color: white;
        }
        
        .btn-secondary {
            background-color: #95a5a6;
            color: white;
        }
        
        .backtest-summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            display: none;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .trades-table-container {
            margin: 20px 0;
            display: none;
        }
        
        .table-wrapper {
            overflow-x: auto;
            margin-top: 15px;
        }
        
        .trades-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
        }
        
        .trades-table th,
        .trades-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .trades-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        
        .trades-table tr:hover {
            background-color: #f5f5f5;
        }
        
        .trades-table .win {
            background-color: #d4edda;
        }
        
        .trades-table .loss {
            background-color: #f8d7da;
        }
        
        .trades-table .points {
            font-weight: bold;
            text-align: right;
        }
        
        .trades-table .result {
            font-weight: bold;
            text-align: center;
        }
        
        .progress-indicator {
            display: none;
            margin: 10px 0;
            padding: 10px;
            background: #fff3cd;
            border-radius: 5px;
            color: #856404;
        }
    `;
    
    document.head.appendChild(style);
}

// Add UI elements to the page - ENHANCED ERROR HANDLING
function addSimpleBacktestUI() {
    // Check if UI already exists
    const existingSection = document.querySelector('.simple-backtest-section');
    if (existingSection) {
        console.log('Simple backtest UI already exists, skipping creation');
        return;
    }
    
    // Find a good place to insert the UI (after the existing controls)
    const controlsDiv = document.querySelector('.controls');
    if (!controlsDiv) {
        console.error('Could not find .controls div to insert backtest UI');
        
        // Fallback: try to find any container
        const container = document.querySelector('.container') || document.body;
        console.log('Using fallback container:', container.className || 'body');
        
        // Create the simple backtest section
        const backtestSection = document.createElement('div');
        backtestSection.className = 'simple-backtest-section';
        backtestSection.innerHTML = getBacktestUIHTML();
        
        container.appendChild(backtestSection);
        console.log('Backtest UI added to fallback container');
        return;
    }
    
    // Create the simple backtest section
    const backtestSection = document.createElement('div');
    backtestSection.className = 'simple-backtest-section';
    backtestSection.innerHTML = getBacktestUIHTML();
    
    // Insert after the controls
    controlsDiv.parentNode.insertBefore(backtestSection, controlsDiv.nextSibling);
    console.log('Backtest UI added after controls div');
}

// Enhanced UI HTML with rule configuration
function getBacktestUIHTML() {
    return `
        <h2>Simple Backtest Engine</h2>
        
        <div class="rule-configuration">
            <h3>Trading Rules Configuration</h3>
            
            <div class="rule-category">
                <h4>Entry Rules</h4>
                <div class="rule-item">
                    <input type="checkbox" id="entryLphLpl" checked>
                    <label for="entryLphLpl">LPH Break Entry (LONG above LPH, SHORT below LPL)</label>
                </div>
                <div class="rule-item">
                    <input type="checkbox" id="gapHandling" checked>
                    <label for="gapHandling">Gap Handling (Enter at market open if gap beyond trigger)</label>
                </div>
            </div>
            
            <div class="rule-category">
                <h4>Exit Rules</h4>
                <div class="rule-item">
                    <input type="checkbox" id="stopLoss" checked>
                    <label for="stopLoss">Stop Loss:</label>
                    <div class="stop-loss-input">
                        <input type="number" id="stopLossPercent" value="0.3" min="0.1" max="5.0" step="0.1">
                        <span>% against position</span>
                    </div>
                </div>
                <div class="rule-item">
                    <input type="checkbox" id="eodExit" checked>
                    <label for="eodExit">End of Day Exit (Mandatory close at day end)</label>
                </div>
            </div>
            
            <div class="rule-category">
                <h4>Special Features</h4>
                <div class="rule-item">
                    <input type="checkbox" id="dailyReset" checked>
                    <label for="dailyReset">Daily Reset (Fresh start each day, no re-trading levels)</label>
                </div>
            </div>
            
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
    `;
}

// Set up event listeners
function setupSimpleBacktestListeners() {
    const runButton = document.getElementById('runSimpleBacktest');
    const clearButton = document.getElementById('clearSimpleResults');
    const resetRulesButton = document.getElementById('resetRules');
    const saveRulesButton = document.getElementById('saveRules');
    
    // Main buttons
    if (runButton) {
        runButton.addEventListener('click', handleRunBacktest);
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', handleClearResults);
    }
    
    // Rule control buttons
    if (resetRulesButton) {
        resetRulesButton.addEventListener('click', resetRulesToDefaults);
    }
    
    if (saveRulesButton) {
        saveRulesButton.addEventListener('click', saveRuleConfiguration);
    }
    
    // Rule checkboxes and inputs
    setupRuleEventListeners();
}

// Set up rule-specific event listeners
function setupRuleEventListeners() {
    // Entry rules
    const entryLphLpl = document.getElementById('entryLphLpl');
    const gapHandling = document.getElementById('gapHandling');
    
    // Exit rules
    const stopLoss = document.getElementById('stopLoss');
    const stopLossPercent = document.getElementById('stopLossPercent');
    const eodExit = document.getElementById('eodExit');
    
    // Special features
    const dailyReset = document.getElementById('dailyReset');
    
    // Add change listeners
    if (entryLphLpl) entryLphLpl.addEventListener('change', updateRuleConfiguration);
    if (gapHandling) gapHandling.addEventListener('change', updateRuleConfiguration);
    if (stopLoss) stopLoss.addEventListener('change', updateRuleConfiguration);
    if (stopLossPercent) stopLossPercent.addEventListener('input', updateRuleConfiguration);
    if (eodExit) eodExit.addEventListener('change', updateRuleConfiguration);
    if (dailyReset) dailyReset.addEventListener('change', updateRuleConfiguration);
    
    // Special handling for stop loss input
    if (stopLoss && stopLossPercent) {
        stopLoss.addEventListener('change', function() {
            stopLossPercent.disabled = !this.checked;
            updateRuleConfiguration();
        });
    }
}

// Update rule configuration from UI
function updateRuleConfiguration() {
    // Read values from UI
    const entryLphLpl = document.getElementById('entryLphLpl');
    const gapHandling = document.getElementById('gapHandling');
    const stopLoss = document.getElementById('stopLoss');
    const stopLossPercent = document.getElementById('stopLossPercent');
    const eodExit = document.getElementById('eodExit');
    const dailyReset = document.getElementById('dailyReset');
    
    // Update configuration
    if (entryLphLpl) window.ruleConfig.entryLphLpl = entryLphLpl.checked;
    if (gapHandling) window.ruleConfig.gapHandling = gapHandling.checked;
    if (stopLoss) window.ruleConfig.stopLoss = stopLoss.checked;
    if (eodExit) window.ruleConfig.eodExit = eodExit.checked;
    if (dailyReset) window.ruleConfig.dailyReset = dailyReset.checked;
    
    // Update stop loss percentage with validation
    if (stopLossPercent) {
        const value = parseFloat(stopLossPercent.value);
        if (!isNaN(value) && value >= 0.1 && value <= 5.0) {
            window.ruleConfig.stopLossPercent = value;
            stopLossPercent.classList.remove('error');
        } else {
            stopLossPercent.classList.add('error');
        }
        
        // Enable/disable stop loss input based on checkbox
        stopLossPercent.disabled = !window.ruleConfig.stopLoss;
    }
    
    // Validate configuration
    validateRuleConfiguration();
    
    console.log('Rule configuration updated:', window.ruleConfig);
}

// Validate rule configuration
function validateRuleConfiguration() {
    const errorDiv = document.getElementById('validationError');
    const runButton = document.getElementById('runSimpleBacktest');
    const errors = [];
    
    // Check entry rules
    if (!window.ruleConfig.entryLphLpl) {
        errors.push('At least one entry rule must be selected (currently only LPH Break Entry available)');
    }
    
    // Check exit rules
    const hasValidStopLoss = window.ruleConfig.stopLoss && 
                           window.ruleConfig.stopLossPercent >= 0.1 && 
                           window.ruleConfig.stopLossPercent <= 5.0;
    const hasValidEodExit = window.ruleConfig.eodExit;
    
    if (!hasValidStopLoss && !hasValidEodExit) {
        errors.push('At least one exit rule must be selected with valid configuration');
    }
    
    // Check stop loss value if enabled
    if (window.ruleConfig.stopLoss) {
        if (isNaN(window.ruleConfig.stopLossPercent) || 
            window.ruleConfig.stopLossPercent < 0.1 || 
            window.ruleConfig.stopLossPercent > 5.0) {
            errors.push('Stop loss percentage must be between 0.1% and 5.0%');
        }
    }
    
    // Display errors and control button state
    if (errors.length > 0) {
        errorDiv.innerHTML = errors.join('<br>');
        errorDiv.style.display = 'block';
        if (runButton) runButton.disabled = true;
    } else {
        errorDiv.style.display = 'none';
        if (runButton) runButton.disabled = false;
    }
    
    return errors.length === 0;
}

// Reset rules to defaults
function resetRulesToDefaults() {
    window.ruleConfig = {
        entryLphLpl: true,
        gapHandling: true,
        stopLoss: true,
        stopLossPercent: 0.3,
        eodExit: true,
        dailyReset: true
    };
    
    updateUIFromConfiguration();
    console.log('Rules reset to defaults');
}

// Update UI from configuration
function updateUIFromConfiguration() {
    const entryLphLpl = document.getElementById('entryLphLpl');
    const gapHandling = document.getElementById('gapHandling');
    const stopLoss = document.getElementById('stopLoss');
    const stopLossPercent = document.getElementById('stopLossPercent');
    const eodExit = document.getElementById('eodExit');
    const dailyReset = document.getElementById('dailyReset');
    
    if (entryLphLpl) entryLphLpl.checked = window.ruleConfig.entryLphLpl;
    if (gapHandling) gapHandling.checked = window.ruleConfig.gapHandling;
    if (stopLoss) stopLoss.checked = window.ruleConfig.stopLoss;
    if (stopLossPercent) {
        stopLossPercent.value = window.ruleConfig.stopLossPercent;
        stopLossPercent.disabled = !window.ruleConfig.stopLoss;
    }
    if (eodExit) eodExit.checked = window.ruleConfig.eodExit;
    if (dailyReset) dailyReset.checked = window.ruleConfig.dailyReset;
    
    validateRuleConfiguration();
}

// Save rule configuration to localStorage
function saveRuleConfiguration() {
    try {
        localStorage.setItem('simpleBacktestRuleConfig', JSON.stringify(window.ruleConfig));
        console.log('Rule configuration saved');
        
        // Show feedback
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
    } catch (error) {
        console.error('Failed to save configuration:', error);
    }
}

// Load rule configuration from localStorage
function loadRuleConfiguration() {
    try {
        const saved = localStorage.getItem('simpleBacktestRuleConfig');
        if (saved) {
            const config = JSON.parse(saved);
            // Merge with defaults to handle missing properties
            window.ruleConfig = {
                entryLphLpl: true,
                gapHandling: true,
                stopLoss: true,
                stopLossPercent: 0.3,
                eodExit: true,
                dailyReset: true,
                ...config
            };
            
            updateUIFromConfiguration();
            console.log('Rule configuration loaded from localStorage');
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
        resetRulesToDefaults();
    }
}

// Handle run backtest button click
function handleRunBacktest() {
    console.log('Run backtest button clicked');
    
    const runButton = document.getElementById('runSimpleBacktest');
    const statusDiv = document.getElementById('backtestStatus');
    
    // Validate configuration before running
    if (!validateRuleConfiguration()) {
        console.log('Rule configuration validation failed');
        return;
    }
    
    // Check if function exists
    if (typeof window.runSimpleBacktest !== 'function') {
        console.error('runSimpleBacktest function not found!');
        console.log('Available window functions:', Object.keys(window).filter(k => k.includes('backtest')));
        alert('Backtest engine not loaded properly. Please refresh the page and try again.');
        return;
    }
    
    // Validate prerequisites
    if (!window.chartData || window.chartData.length === 0) {
        alert('Please form bars first by uploading a CSV file and clicking "Form Bars"');
        return;
    }
    
    if (!window.pivotData || (!window.pivotData.lph && !window.pivotData.lpl)) {
        alert('Please detect pivots first by clicking "Detect Pivots"');
        return;
    }
    
    if (window.pivotData.lph.length === 0 && window.pivotData.lpl.length === 0) {
        alert('No LPH or LPL pivots found. Cannot run backtest.');
        return;
    }
    
    // Show progress
    runButton.disabled = true;
    runButton.textContent = 'Running...';
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Running backtest with selected rules...';
    
    // Run backtest with slight delay to show progress
    setTimeout(() => {
        try {
            console.log('About to call runSimpleBacktest with configuration:', window.ruleConfig);
            window.runSimpleBacktest();
            console.log('Backtest completed successfully');
        } catch (error) {
            console.error('Backtest error:', error);
            alert('Error running backtest: ' + error.message);
        } finally {
            // Reset button state
            runButton.disabled = false;
            runButton.textContent = 'Run Simple Backtest';
            statusDiv.style.display = 'none';
        }
    }, 100);
}

// Handle clear results button click
function handleClearResults() {
    console.log('Clear results button clicked');
    
    // Clear summary
    const summaryDiv = document.getElementById('backtest-summary');
    if (summaryDiv) {
        summaryDiv.style.display = 'none';
    }
    
    // Clear trades table
    const tableDiv = document.getElementById('trades-table-container');
    if (tableDiv) {
        tableDiv.style.display = 'none';
    }
    
    // Clear status
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
    
    // Reset backtest state
    if (window.backtestState) {
        window.backtestState.trades = [];
        window.backtestState.currentPosition = null;
        window.backtestState.tradedLevelsToday = [];
    }
    
    console.log('Results cleared');
}

// Initialize when DOM is ready - FIXED TIMING
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing enhanced simple backtest UI...');
    
    // Wait a bit longer to ensure other scripts are loaded
    setTimeout(function() {
        console.log('Attempting to initialize enhanced simple backtest UI...');
        initializeSimpleBacktestUI();
    }, 1000); // Increased delay
});

// Also try to initialize when window loads
window.addEventListener('load', function() {
    console.log('Window loaded, checking if UI needs initialization...');
    
    // Check if UI already exists
    const existingSection = document.querySelector('.simple-backtest-section');
    if (!existingSection) {
        console.log('UI not found, initializing...');
        setTimeout(initializeSimpleBacktestUI, 500);
    } else {
        console.log('UI already exists');
    }
});

// Also initialize if called directly
if (typeof window !== 'undefined') {
    window.initializeSimpleBacktestUI = initializeSimpleBacktestUI;
    window.addSimpleBacktestUI = addSimpleBacktestUI; // Export for manual calling
    
    // Try immediate initialization if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('Document already ready, initializing immediately...');
        setTimeout(initializeSimpleBacktestUI, 100);
    }
}

// Emergency manual initialization function for console
window.forceInitBacktestUI = function() {
    console.log('🚨 MANUAL UI INITIALIZATION 🚨');
    
    // Remove existing UI if any
    const existing = document.querySelector('.simple-backtest-section');
    if (existing) {
        existing.remove();
        console.log('Removed existing UI');
    }
    
    // Force create new UI
    addSimpleBacktestUI();
    
    // Force setup event listeners
    setupSimpleBacktestListeners();
    
    // Load configuration
    loadRuleConfiguration();
    
    console.log('✅ Manual UI initialization complete');
    console.log('Rule configuration UI should now be visible');
};
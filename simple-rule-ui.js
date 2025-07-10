// simple-rule-ui.js
// Simple UI for the minimal backtesting system

// Initialize UI components
function initializeSimpleBacktestUI() {
    console.log('Initializing Simple Backtest UI...');
    
    // Add CSS styles
    addSimpleBacktestStyles();
    
    // Add UI elements to the existing page
    addSimpleBacktestUI();
    
    // Set up event listeners
    setupSimpleBacktestListeners();
    
    console.log('Simple Backtest UI initialized successfully');
}

// Add CSS styles for the backtest UI
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
        
        .rule-description {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 14px;
            color: #1565c0;
        }
        
        .rule-description h4 {
            margin: 0 0 10px 0;
            color: #0d47a1;
        }
        
        .rule-description ul {
            margin: 5px 0;
            padding-left: 20px;
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

// Separate function for UI HTML to make it reusable
function getBacktestUIHTML() {
    return `
        <h2>Simple Backtest Engine</h2>
        
        <div class="rule-description">
            <h4>Current Rules:</h4>
            <ul>
                <li><strong>Entry:</strong> LONG above LPH break OR SHORT below LPL break</li>
                <li><strong>Gap Handling:</strong> Enter at market open if gap beyond trigger level</li>
                <li><strong>Exit 1:</strong> Stop Loss at 0.3% against position (below entry for long, above entry for short)</li>
                <li><strong>Exit 2:</strong> End of Day (EOD) mandatory exit</li>
                <li><strong>Daily Reset:</strong> Fresh start each day, no re-trading same levels</li>
            </ul>
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
    
    if (runButton) {
        runButton.addEventListener('click', handleRunBacktest);
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', handleClearResults);
    }
}

// Handle run backtest button click
function handleRunBacktest() {
    console.log('Run backtest button clicked');
    
    const runButton = document.getElementById('runSimpleBacktest');
    const statusDiv = document.getElementById('backtestStatus');
    
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
    statusDiv.textContent = 'Running backtest...';
    
    // Run backtest with slight delay to show progress
    setTimeout(() => {
        try {
            console.log('About to call runSimpleBacktest...');
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
    console.log('DOM loaded, initializing simple backtest UI...');
    
    // Wait a bit longer to ensure other scripts are loaded
    setTimeout(function() {
        console.log('Attempting to initialize simple backtest UI...');
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
    
    console.log('✅ Manual UI initialization complete');
    console.log('Buttons should now be visible');
};
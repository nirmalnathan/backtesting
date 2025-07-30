// backtest/engine/backtest-orchestrator.js
// Main orchestrator - coordinates the entire backtest process

class BacktestOrchestrator {
    constructor() {
        this.dataManager = null;
        this.stateManager = null;
        this.ruleProcessor = null;
        this.positionManager = null;
        this.tradeTracker = null;
    }
    
    // Initialize backtest with required processors
    initialize() {
        // Initialize managers
        this.dataManager = new BacktestDataManager();
        this.stateManager = new BacktestStateManager();
        
        // Initialize processors
        this.ruleProcessor = new RuleProcessor();
        this.positionManager = new PositionManager();
        this.tradeTracker = new TradeTracker();
        
        // Validate dependencies
        if (!window.chartData || !window.pivotData) {
            throw new Error('Chart data and pivot data required for backtesting');
        }
        
        if (!window.ruleConfig) {
            throw new Error('Rule configuration required for backtesting');
        }
        
        console.log('Backtest orchestrator initialized successfully');
        return true;
    }
    
    // Main backtest execution function
    runBacktest() {
        console.log('=== STARTING MODULAR BACKTEST ===');
        
        try {
            // Initialize and validate
            this.initialize();
            this.validateConfiguration();
            
            // Reset state
            this.stateManager.resetState();
            
            // Make state available globally for level tracking
            window.backtestState = this.stateManager.getState();
            
            const data = window.chartData;
            const pivots = window.pivotData;
            
            console.log(`Processing ${data.length} bars with modular engine`);
            console.log(`Available pivots: SPH(${pivots.sph.length}), SPL(${pivots.spl.length}), LPH(${pivots.lph.length}), LPL(${pivots.lpl.length})`);
            
            // Process each bar
            this.stateManager.setRunning(true);
            
            for (let barIndex = 0; barIndex < data.length; barIndex++) {
                const currentBar = data[barIndex];
                this.dataManager.processBar(
                    barIndex, 
                    currentBar, 
                    data, 
                    pivots,
                    this.stateManager,
                    this.ruleProcessor,
                    this.positionManager,
                    this.tradeTracker
                );
            }
            
            // Final cleanup
            this.dataManager.handleFinalExit(data, this.stateManager, this.positionManager, this.tradeTracker);
            
            this.stateManager.setRunning(false);
            
            console.log('=== BACKTEST COMPLETED ===');
            console.log(`Total trades: ${this.stateManager.getTrades().length}`);
            
            // Log final level states for debugging
            this.stateManager.logLevelStates();
            
            // Display results
            this.displayResults();
            
            return this.stateManager.getTrades();
            
        } catch (error) {
            this.stateManager.setRunning(false);
            console.error('Backtest error:', error);
            throw error;
        }
    }
    
    // Validate configuration before running
    validateConfiguration() {
        if (!window.ruleConfig) {
            throw new Error('No rule configuration found');
        }
        
        // Check entry rules
        if (!window.ruleConfig.entryLphLpl) {
            throw new Error('No entry rules enabled');
        }
        
        // Warn about no exit rules
        const hasStopLoss = window.ruleConfig.stopLoss;
        const hasEodExit = window.ruleConfig.eodExit;
        const hasTrailingSpl = window.ruleConfig.trailingSpl;
        
        if (!hasStopLoss && !hasEodExit && !hasTrailingSpl) {
            const proceed = confirm(
                'WARNING: All exit rules are disabled!\n\n' +
                'This could result in positions running indefinitely.\n\n' +
                'Continue anyway?'
            );
            
            if (!proceed) {
                throw new Error('Backtest cancelled - No exit rules enabled');
            }
        }
        
        console.log('Configuration validation passed');
    }
    
    // Display results using results display module
    displayResults() {
        const trades = this.stateManager.getTrades();
        
        if (typeof window.displayBacktestResults === 'function') {
            window.displayBacktestResults(trades);
        } else if (typeof displaySimpleResults === 'function') {
            displaySimpleResults(trades);
        } else {
            console.log('No results display function available');
            console.log('Trades:', trades);
        }
    }
    
    // Get current backtest state (for debugging)
    getState() {
        return this.stateManager ? this.stateManager.getState() : null;
    }
    
    // Check if backtest is currently running
    isRunning() {
        return this.stateManager ? this.stateManager.isRunning() : false;
    }
    
    // Get performance summary
    getPerformanceSummary() {
        return this.stateManager ? this.stateManager.getPerformanceSummary() : null;
    }
    
    // Export backtest data
    exportBacktestData() {
        return {
            trades: this.stateManager.getTrades(),
            configuration: window.ruleConfig,
            performance: this.getPerformanceSummary(),
            exportTime: new Date().toISOString()
        };
    }
    
    // Import and replay backtest
    replayBacktest(importedData) {
        if (!importedData || !importedData.trades) {
            throw new Error('Invalid import data');
        }
        
        // Initialize if needed
        if (!this.stateManager) {
            this.initialize();
        }
        
        // Set configuration
        if (importedData.configuration) {
            window.ruleConfig = { ...importedData.configuration };
        }
        
        // Set trades
        this.stateManager.setTrades([...importedData.trades]);
        
        // Display results
        this.displayResults();
        
        console.log('Backtest replayed successfully');
        return true;
    }
    
    // Stop running backtest
    stopBacktest() {
        if (this.stateManager && this.stateManager.isRunning()) {
            this.stateManager.setRunning(false);
            console.log('Backtest stopped by user');
            return true;
        }
        return false;
    }
}

// Global backtest runner function (maintains compatibility)
function runBacktest() {
    const backtestOrchestrator = new BacktestOrchestrator();
    return backtestOrchestrator.runBacktest();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BacktestOrchestrator = BacktestOrchestrator;
    window.runBacktest = runBacktest;
    
    // Maintain compatibility with existing simple backtest
    window.runSimpleBacktest = runBacktest;
    
    // Make backtest orchestrator instance available globally
    window.backtestOrchestrator = new BacktestOrchestrator();
    
    // Maintain backward compatibility
    window.BacktestCore = BacktestOrchestrator;
    window.backtestCore = window.backtestOrchestrator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BacktestOrchestrator, runBacktest };
}
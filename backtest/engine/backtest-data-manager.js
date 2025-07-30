// backtest/engine/backtest-data-manager.js
// Data processing and bar management for backtesting

class BacktestDataManager {
    constructor() {
        // Data manager doesn't maintain its own state
        // It processes data and delegates to state manager
    }
    
    // Process individual bar
    processBar(barIndex, currentBar, data, pivots, stateManager, ruleProcessor, positionManager, tradeTracker) {
        const currentDate = new Date(currentBar.datetime).toDateString();
        
        // Check for new day
        if (stateManager.getCurrentDay() !== currentDate) {
            this.handleNewDay(currentDate, barIndex, currentBar, stateManager, positionManager, tradeTracker);
        }
        
        // Process exits first (if in position)
        const currentPosition = stateManager.getCurrentPosition();
        if (currentPosition) {
            const exitResult = ruleProcessor.processExits(
                currentPosition, 
                barIndex, 
                currentBar, 
                data
            );
            
            if (exitResult.shouldExit) {
                const completedTrade = positionManager.exitPosition(
                    currentPosition,
                    barIndex,
                    currentBar,
                    exitResult.exitPrice,
                    exitResult.exitReason,
                    tradeTracker
                );
                
                // Add trade to results
                if (completedTrade) {
                    stateManager.addTrade(completedTrade);
                }
                stateManager.clearCurrentPosition();
            }
        }
        
        // Update level states based on current price action
        stateManager.updateLevelStates(currentBar, pivots);
        
        // Process entries (if not in position)
        if (!stateManager.getCurrentPosition()) {
            const entryResult = ruleProcessor.processEntries(
                barIndex,
                currentBar,
                data,
                pivots,
                stateManager.getLevelStates()
            );
            
            if (entryResult.shouldEnter) {
                const newPosition = positionManager.enterPosition(
                    entryResult,
                    barIndex,
                    currentBar,
                    tradeTracker
                );
                
                stateManager.setCurrentPosition(newPosition);
                
                // Update level states with entry result and legacy traded levels
                stateManager.updateLevelStatesAfterEntry(currentBar, pivots, entryResult, barIndex);
                stateManager.updateTradedLevels(entryResult);
                
                // Check exits again for newly entered position (important for EOD)
                const secondExitResult = ruleProcessor.processExits(
                    newPosition,
                    barIndex,
                    currentBar,
                    data
                );
                
                if (secondExitResult.shouldExit) {
                    const completedTrade = positionManager.exitPosition(
                        newPosition,
                        barIndex,
                        currentBar,
                        secondExitResult.exitPrice,
                        secondExitResult.exitReason,
                        tradeTracker
                    );
                    
                    // Add trade to results
                    if (completedTrade) {
                        stateManager.addTrade(completedTrade);
                    }
                    stateManager.clearCurrentPosition();
                }
            }
        }
        
        // Update position tracking
        const updatedPosition = stateManager.getCurrentPosition();
        if (updatedPosition) {
            tradeTracker.updatePosition(updatedPosition, currentBar);
        }
    }
    
    // Handle new trading day
    handleNewDay(newDate, barIndex, currentBar, stateManager, positionManager, tradeTracker) {
        console.log(`\n=== NEW DAY: ${newDate} (Bar ${barIndex}) ===`);
        
        // Force EOD exit if position exists and EOD rule enabled
        const currentPosition = stateManager.getCurrentPosition();
        if (currentPosition && window.ruleConfig.eodExit) {
            console.log('Force EOD exit from previous day');
            const completedTrade = positionManager.exitPosition(
                currentPosition,
                barIndex,
                currentBar,
                currentBar.open,
                'EOD Exit - Previous Day',
                tradeTracker
            );
            
            if (completedTrade) {
                stateManager.addTrade(completedTrade);
            }
            stateManager.clearCurrentPosition();
        }
        
        // Update current day in state
        stateManager.setCurrentDay(newDate);
        
        // Reset daily state if daily reset enabled
        if (window.ruleConfig.dailyReset) {
            console.log('Reset traded levels for new day');
            stateManager.resetDailyState();
        }
    }
    
    // Handle final exit at end of data
    handleFinalExit(data, stateManager, positionManager, tradeTracker) {
        const currentPosition = stateManager.getCurrentPosition();
        if (currentPosition && window.ruleConfig.eodExit) {
            const lastBar = data[data.length - 1];
            const completedTrade = positionManager.exitPosition(
                currentPosition,
                data.length - 1,
                lastBar,
                lastBar.close,
                'EOD Exit - Final',
                tradeTracker
            );
            
            if (completedTrade) {
                stateManager.addTrade(completedTrade);
            }
            stateManager.clearCurrentPosition();
        }
    }
    
    // Validate data integrity
    validateData(data, pivots) {
        if (!data || data.length === 0) {
            throw new Error('No chart data available');
        }
        
        if (!pivots) {
            throw new Error('No pivot data available');
        }
        
        // Check data format
        const requiredFields = ['datetime', 'open', 'high', 'low', 'close'];
        const firstBar = data[0];
        
        for (const field of requiredFields) {
            if (!(field in firstBar)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('Data validation passed');
        return true;
    }
    
    // Get data statistics
    getDataStats(data) {
        if (!data || data.length === 0) {
            return null;
        }
        
        const firstBar = data[0];
        const lastBar = data[data.length - 1];
        
        return {
            totalBars: data.length,
            startDate: new Date(firstBar.datetime).toDateString(),
            endDate: new Date(lastBar.datetime).toDateString(),
            priceRange: {
                high: Math.max(...data.map(bar => bar.high)),
                low: Math.min(...data.map(bar => bar.low))
            }
        };
    }
    
    // Process data for analysis
    processDataForAnalysis(data, pivots) {
        return {
            bars: data.length,
            pivots: {
                sph: pivots.sph?.length || 0,
                spl: pivots.spl?.length || 0,
                lph: pivots.lph?.length || 0,
                lpl: pivots.lpl?.length || 0
            },
            dateRange: this.getDataStats(data)
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BacktestDataManager = BacktestDataManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BacktestDataManager };
}
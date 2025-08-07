// backtest/engine/backtest-state-manager.js
// State management for backtesting - positions, levels, trades

class BacktestStateManager {
    constructor() {
        this.state = {
            currentPosition: null,
            tradedLevelsToday: [], // Keep for backward compatibility
            levelStates: new Map(), // New level state tracking system
            currentDay: null,
            trades: [],
            niftyValue: 25000,
            isRunning: false
        };
    }
    
    // Reset backtest state
    resetState() {
        this.state = {
            currentPosition: null,
            tradedLevelsToday: [],
            levelStates: new Map(), // Include the levelStates Map
            currentDay: null,
            trades: [],
            niftyValue: 25000,
            isRunning: true
        };
        
        console.log('Backtest state reset');
    }
    
    // Position management
    getCurrentPosition() {
        return this.state.currentPosition;
    }
    
    setCurrentPosition(position) {
        this.state.currentPosition = position;
    }
    
    clearCurrentPosition() {
        this.state.currentPosition = null;
    }
    
    // Trade management
    getTrades() {
        return this.state.trades;
    }
    
    setTrades(trades) {
        this.state.trades = trades;
    }
    
    addTrade(trade) {
        this.state.trades.push(trade);
    }
    
    // Day management
    getCurrentDay() {
        return this.state.currentDay;
    }
    
    setCurrentDay(day) {
        this.state.currentDay = day;
    }
    
    // Running state management
    isRunning() {
        return this.state.isRunning;
    }
    
    setRunning(running) {
        this.state.isRunning = running;
    }
    
    // Level states management
    getLevelStates() {
        return this.state.levelStates;
    }
    
    // Reset daily state
    resetDailyState() {
        this.state.tradedLevelsToday = [];
        this.state.levelStates.clear(); // Reset level states for new day
    }
    
    // Update level states based on price action (invalidation/revalidation tracking)
    updateLevelStates(currentBar, pivots) {
        // Get current LPH and LPL levels
        const data = window.chartData;
        const currentDay = new Date(currentBar.datetime).toDateString();
        
        // Check for next-day gap entries (reset traded levels if new day)
        this.checkForNextDayGapEntries(currentDay);
        
        // Update all LPH levels
        if (pivots.lph && pivots.lph.length > 0) {
            pivots.lph.forEach(lphBarIndex => {
                if (lphBarIndex < data.length) {
                    const lphLevel = data[lphBarIndex].high;
                    const levelKey = `LPH_${lphLevel.toFixed(2)}`;
                    
                    if (!this.state.levelStates.has(levelKey)) {
                        this.state.levelStates.set(levelKey, {
                            level: lphLevel,
                            type: 'LPH',
                            status: 'available',
                            lastTradeBarIndex: -1,
                            lastTradeDay: null,
                            needsRevalidation: false
                        });
                    }
                    
                    const levelState = this.state.levelStates.get(levelKey);
                    
                    // Check for invalidation (price went below LPH level)
                    if (levelState.status === 'traded' && levelState.needsRevalidation) {
                        if (currentBar.low <= lphLevel) {
                            levelState.status = 'invalidated';
                            levelState.needsRevalidation = false;
                            console.log(`❌ LPH ${lphLevel.toFixed(2)} INVALIDATED (price below level)`);
                        }
                    }
                    
                    // Check for revalidation (price crossed above again after invalidation)
                    if (levelState.status === 'invalidated') {
                        if (currentBar.high > lphLevel) {
                            levelState.status = 'available';
                            console.log(`✅ LPH ${lphLevel.toFixed(2)} REVALIDATED (available for re-entry)`);
                        }
                    }
                }
            });
        }
        
        // Update all LPL levels
        if (pivots.lpl && pivots.lpl.length > 0) {
            pivots.lpl.forEach(lplBarIndex => {
                if (lplBarIndex < data.length) {
                    const lplLevel = data[lplBarIndex].low;
                    const levelKey = `LPL_${lplLevel.toFixed(2)}`;
                    
                    if (!this.state.levelStates.has(levelKey)) {
                        this.state.levelStates.set(levelKey, {
                            level: lplLevel,
                            type: 'LPL',
                            status: 'available',
                            lastTradeBarIndex: -1,
                            lastTradeDay: null,
                            needsRevalidation: false
                        });
                    }
                    
                    const levelState = this.state.levelStates.get(levelKey);
                    
                    // Check for invalidation (price went above LPL level)
                    if (levelState.status === 'traded' && levelState.needsRevalidation) {
                        if (currentBar.high >= lplLevel) {
                            levelState.status = 'invalidated';
                            levelState.needsRevalidation = false;
                            console.log(`❌ LPL ${lplLevel.toFixed(2)} INVALIDATED (price above level)`);
                        }
                    }
                    
                    // Check for revalidation (price crossed below again after invalidation)
                    if (levelState.status === 'invalidated') {
                        if (currentBar.low < lplLevel) {
                            levelState.status = 'available';
                            console.log(`✅ LPL ${lplLevel.toFixed(2)} REVALIDATED (available for re-entry)`);
                        }
                    }
                }
            });
        }
    }
    
    // Check for next-day gap entries - reset traded levels if it's a new day
    checkForNextDayGapEntries(currentDay) {
        this.state.levelStates.forEach((levelState, levelKey) => {
            // If level was traded and it's a new day, make it available for gap entries
            // BUT preserve retest requirement if level needs revalidation
            if (levelState.status === 'traded' && 
                levelState.lastTradeDay && 
                levelState.lastTradeDay !== currentDay) {
                
                levelState.status = 'available';
                // DON'T clear needsRevalidation - retest requirement should persist across days
                
                if (window.debugLogger) {
                    window.debugLogger.pivot(`Next-day reset: ${levelKey} now available for gap entries`, {
                        level: levelState.level,
                        lastTradeDay: levelState.lastTradeDay,
                        currentDay: currentDay
                    });
                }
                
                const retestStatus = levelState.needsRevalidation ? ' - STILL NEEDS RETEST' : '';
                console.log(`🌅 Next-day reset: ${levelKey} now available for gap entries (traded on ${levelState.lastTradeDay}, now ${currentDay})${retestStatus}`);
            }
        });
    }
    
    // Update level states after entry (separate method to handle entry results)
    updateLevelStatesAfterEntry(currentBar, pivots, entryResult, barIndex) {
        const currentDay = new Date(currentBar.datetime).toDateString();
        
        // Find and update the specific level that was just traded
        if (entryResult.levelType === 'LPH') {
            const levelKey = `LPH_${entryResult.tradedLevel.toFixed(2)}`;
            if (this.state.levelStates.has(levelKey)) {
                const levelState = this.state.levelStates.get(levelKey);
                levelState.status = 'traded';
                levelState.needsRevalidation = true;
                levelState.lastTradeBarIndex = barIndex;
                levelState.lastTradeDay = currentDay;
                console.log(`📝 LPH ${entryResult.tradedLevel.toFixed(2)} marked as TRADED on ${currentDay}`);
            }
        } else if (entryResult.levelType === 'LPL') {
            const levelKey = `LPL_${entryResult.tradedLevel.toFixed(2)}`;
            if (this.state.levelStates.has(levelKey)) {
                const levelState = this.state.levelStates.get(levelKey);
                levelState.status = 'traded';
                levelState.needsRevalidation = true;
                levelState.lastTradeBarIndex = barIndex;
                levelState.lastTradeDay = currentDay;
                console.log(`📝 LPL ${entryResult.tradedLevel.toFixed(2)} marked as TRADED on ${currentDay}`);
            }
        }
    }
    
    // Update traded levels tracking
    updateTradedLevels(entryResult) {
        if (window.ruleConfig.dailyReset && entryResult.tradedLevel) {
            this.state.tradedLevelsToday.push({
                level: entryResult.tradedLevel,
                type: entryResult.levelType,
                barIndex: entryResult.barIndex
            });
        }
    }
    
    // Get current backtest state (for debugging)
    getState() {
        return { ...this.state };
    }
    
    // Get performance summary
    getPerformanceSummary() {
        if (this.state.trades.length === 0) {
            return {
                totalTrades: 0,
                totalPoints: 0,
                winRate: 0,
                avgPointsPerTrade: 0
            };
        }
        
        const totalTrades = this.state.trades.length;
        const totalPoints = this.state.trades.reduce((sum, trade) => sum + trade.points, 0);
        const winningTrades = this.state.trades.filter(trade => trade.points > 0).length;
        const winRate = (winningTrades / totalTrades) * 100;
        const avgPointsPerTrade = totalPoints / totalTrades;
        
        return {
            totalTrades,
            totalPoints,
            winRate,
            avgPointsPerTrade,
            winningTrades,
            losingTrades: totalTrades - winningTrades
        };
    }
    
    // Log level states for debugging
    logLevelStates() {
        console.log('\n📊 LEVEL STATES SUMMARY:');
        if (this.state.levelStates.size === 0) {
            console.log('No levels tracked');
            return;
        }
        
        let availableCount = 0;
        let tradedCount = 0;
        let invalidatedCount = 0;
        
        this.state.levelStates.forEach((state, key) => {
            console.log(`${key}: ${state.status} (level: ${state.level.toFixed(2)})`);
            switch(state.status) {
                case 'available': availableCount++; break;
                case 'traded': tradedCount++; break;
                case 'invalidated': invalidatedCount++; break;
            }
        });
        
        console.log(`Total: ${this.state.levelStates.size} levels (Available: ${availableCount}, Traded: ${tradedCount}, Invalidated: ${invalidatedCount})`);
    }
    
    // Get traded levels for today
    getTradedLevelsToday() {
        return this.state.tradedLevelsToday;
    }
    
    // Check if level was traded today
    isLevelTradedToday(level, levelType) {
        return this.state.tradedLevelsToday.some(traded => 
            Math.abs(traded.level - level) < 0.01 && traded.type === levelType
        );
    }
    
    // Get NIFTY value
    getNiftyValue() {
        return this.state.niftyValue;
    }
    
    // Set NIFTY value
    setNiftyValue(value) {
        this.state.niftyValue = value;
    }
    
    // Get current state snapshot for external analysis
    getStateSnapshot() {
        return {
            hasPosition: this.state.currentPosition !== null,
            currentDay: this.state.currentDay,
            totalTrades: this.state.trades.length,
            totalLevels: this.state.levelStates.size,
            isRunning: this.state.isRunning,
            tradedLevelsToday: this.state.tradedLevelsToday.length
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BacktestStateManager = BacktestStateManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BacktestStateManager };
}
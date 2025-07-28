// utils/trade-tracker.js
// Tracks individual trades and maintains trade history

class TradeTracker {
    constructor() {
        this.currentTrade = null;
        this.tradeHistory = [];
        this.tradeCounter = 0;
    }
    
    // Start tracking a new trade
    startNewTrade(position) {
        this.tradeCounter++;
        
        this.currentTrade = {
            tradeId: this.tradeCounter,
            direction: position.direction,
            entryBar: position.entryBar,
            entryPrice: position.entryPrice,
            entryTime: position.entryTime,
            entryRule: position.entryRule,
            
            // Exit data (filled when trade completes)
            exitBar: null,
            exitPrice: null,
            exitTime: null,
            exitRule: null,
            
            // P&L data
            points: null,
            duration: null,
            isWin: null,
            
            // Position tracking data
            highestPrice: position.highestPrice,
            lowestPrice: position.lowestPrice,
            maxFavorableExcursion: 0,
            maxAdverseExcursion: 0,
            
            // Metadata
            positionId: position.id,
            tradedLevel: position.tradedLevel,
            levelType: position.levelType,
            stopLoss: position.stopLoss
        };
        
        console.log(`📊 Started tracking trade #${this.tradeCounter}`);
        return this.currentTrade;
    }
    
    // Update position tracking during trade
    updatePosition(position, currentBar) {
        if (!this.currentTrade) return;
        
        // Update price extremes
        if (position.direction === 'LONG') {
            if (currentBar.high > this.currentTrade.highestPrice) {
                this.currentTrade.highestPrice = currentBar.high;
            }
            
            // Update excursions
            const favorableExcursion = currentBar.high - this.currentTrade.entryPrice;
            const adverseExcursion = this.currentTrade.entryPrice - currentBar.low;
            
            if (favorableExcursion > this.currentTrade.maxFavorableExcursion) {
                this.currentTrade.maxFavorableExcursion = favorableExcursion;
            }
            if (adverseExcursion > this.currentTrade.maxAdverseExcursion) {
                this.currentTrade.maxAdverseExcursion = adverseExcursion;
            }
            
        } else { // SHORT
            if (currentBar.low < this.currentTrade.lowestPrice) {
                this.currentTrade.lowestPrice = currentBar.low;
            }
            
            // Update excursions
            const favorableExcursion = this.currentTrade.entryPrice - currentBar.low;
            const adverseExcursion = currentBar.high - this.currentTrade.entryPrice;
            
            if (favorableExcursion > this.currentTrade.maxFavorableExcursion) {
                this.currentTrade.maxFavorableExcursion = favorableExcursion;
            }
            if (adverseExcursion > this.currentTrade.maxAdverseExcursion) {
                this.currentTrade.maxAdverseExcursion = adverseExcursion;
            }
        }
    }
    
    // Complete current trade
    completeTrade(position, exitBar, currentBar, exitPrice, exitReason, points, duration) {
        if (!this.currentTrade) {
            console.error('No current trade to complete');
            return null;
        }
        
        // Fill exit data
        this.currentTrade.exitBar = exitBar;
        this.currentTrade.exitPrice = exitPrice;
        this.currentTrade.exitTime = currentBar.datetime;
        this.currentTrade.exitRule = exitReason;
        this.currentTrade.points = points;
        this.currentTrade.duration = duration;
        this.currentTrade.isWin = points > 0;
        
        // Add to history
        const completedTrade = { ...this.currentTrade };
        this.tradeHistory.push(completedTrade);
        
        console.log(`📊 Completed trade #${this.currentTrade.tradeId}: ${points > 0 ? 'WIN' : 'LOSS'} (${points.toFixed(2)} points)`);
        
        // Clear current trade
        this.currentTrade = null;
        
        return completedTrade;
    }
    
    // Get current trade (for accessing during position)
    getCurrentTrade() {
        return this.currentTrade;
    }
    
    // Get all completed trades
    getAllTrades() {
        return [...this.tradeHistory];
    }
    
    // Get trade statistics
    getTradeStatistics() {
        if (this.tradeHistory.length === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                totalPoints: 0,
                avgPointsPerTrade: 0,
                avgWinPoints: 0,
                avgLossPoints: 0,
                maxWin: 0,
                maxLoss: 0,
                avgDuration: 0,
                profitFactor: 0
            };
        }
        
        const totalTrades = this.tradeHistory.length;
        const winningTrades = this.tradeHistory.filter(t => t.isWin);
        const losingTrades = this.tradeHistory.filter(t => !t.isWin);
        
        const totalPoints = this.tradeHistory.reduce((sum, t) => sum + t.points, 0);
        const avgPointsPerTrade = totalPoints / totalTrades;
        
        const winPoints = winningTrades.reduce((sum, t) => sum + t.points, 0);
        const lossPoints = Math.abs(losingTrades.reduce((sum, t) => sum + t.points, 0));
        
        const avgWinPoints = winningTrades.length > 0 ? winPoints / winningTrades.length : 0;
        const avgLossPoints = losingTrades.length > 0 ? lossPoints / losingTrades.length : 0;
        
        const maxWin = Math.max(...this.tradeHistory.map(t => t.points));
        const maxLoss = Math.min(...this.tradeHistory.map(t => t.points));
        
        const avgDuration = this.tradeHistory.reduce((sum, t) => sum + t.duration, 0) / totalTrades;
        
        const profitFactor = lossPoints > 0 ? winPoints / lossPoints : winPoints > 0 ? Infinity : 0;
        
        return {
            totalTrades,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: (winningTrades.length / totalTrades) * 100,
            totalPoints,
            avgPointsPerTrade,
            avgWinPoints,
            avgLossPoints,
            maxWin,
            maxLoss,
            avgDuration,
            profitFactor
        };
    }
    
    // Get trades by entry rule
    getTradesByEntryRule(ruleName) {
        return this.tradeHistory.filter(trade => 
            trade.entryRule.toLowerCase().includes(ruleName.toLowerCase())
        );
    }
    
    // Get trades by exit rule
    getTradesByExitRule(ruleName) {
        return this.tradeHistory.filter(trade => 
            trade.exitRule.toLowerCase().includes(ruleName.toLowerCase())
        );
    }
    
    // Get trades by direction
    getTradesByDirection(direction) {
        return this.tradeHistory.filter(trade => trade.direction === direction);
    }
    
    // Get recent high for re-entry rules (from last stopped out trade)
    getRecentHighFromStoppedTrade() {
        // Find last trade that was stopped out
        for (let i = this.tradeHistory.length - 1; i >= 0; i--) {
            const trade = this.tradeHistory[i];
            if (trade.exitRule.includes('Stop Loss') && trade.direction === 'LONG') {
                return trade.highestPrice;
            }
        }
        return null;
    }
    
    // Get recent low for re-entry rules (from last stopped out trade)
    getRecentLowFromStoppedTrade() {
        // Find last trade that was stopped out
        for (let i = this.tradeHistory.length - 1; i >= 0; i--) {
            const trade = this.tradeHistory[i];
            if (trade.exitRule.includes('Stop Loss') && trade.direction === 'SHORT') {
                return trade.lowestPrice;
            }
        }
        return null;
    }
    
    // Check if level was recently traded (for re-entry rules)
    wasLevelRecentlyTraded(level, levelType, barsBack = 10) {
        const recentTrades = this.tradeHistory.slice(-barsBack);
        
        return recentTrades.some(trade => 
            trade.levelType === levelType && 
            Math.abs(trade.tradedLevel - level) < 0.1
        );
    }
    
    // Get performance by time period
    getPerformanceByPeriod(startDate, endDate) {
        const filteredTrades = this.tradeHistory.filter(trade => {
            const tradeDate = new Date(trade.entryTime);
            return tradeDate >= startDate && tradeDate <= endDate;
        });
        
        if (filteredTrades.length === 0) return null;
        
        const totalPoints = filteredTrades.reduce((sum, t) => sum + t.points, 0);
        const winningTrades = filteredTrades.filter(t => t.isWin).length;
        
        return {
            trades: filteredTrades.length,
            totalPoints,
            winRate: (winningTrades / filteredTrades.length) * 100,
            avgPointsPerTrade: totalPoints / filteredTrades.length
        };
    }
    
    // Reset trade tracking
    reset() {
        this.currentTrade = null;
        this.tradeHistory = [];
        this.tradeCounter = 0;
        console.log('📊 Trade tracker reset');
    }
    
    // Export trade data for analysis
    exportTrades() {
        return {
            trades: this.getAllTrades(),
            statistics: this.getTradeStatistics(),
            exportTime: new Date().toISOString()
        };
    }
    
    // Get detailed trade analysis
    getDetailedAnalysis() {
        const stats = this.getTradeStatistics();
        const longTrades = this.getTradesByDirection('LONG');
        const shortTrades = this.getTradesByDirection('SHORT');
        
        const lphTrades = this.getTradesByEntryRule('LPH');
        const lplTrades = this.getTradesByEntryRule('LPL');
        
        const stopLossExits = this.getTradesByExitRule('Stop Loss');
        const eodExits = this.getTradesByExitRule('EOD');
        
        return {
            overall: stats,
            byDirection: {
                long: {
                    count: longTrades.length,
                    totalPoints: longTrades.reduce((sum, t) => sum + t.points, 0),
                    winRate: longTrades.length > 0 ? (longTrades.filter(t => t.isWin).length / longTrades.length) * 100 : 0
                },
                short: {
                    count: shortTrades.length,
                    totalPoints: shortTrades.reduce((sum, t) => sum + t.points, 0),
                    winRate: shortTrades.length > 0 ? (shortTrades.filter(t => t.isWin).length / shortTrades.length) * 100 : 0
                }
            },
            byEntryRule: {
                lph: {
                    count: lphTrades.length,
                    totalPoints: lphTrades.reduce((sum, t) => sum + t.points, 0),
                    winRate: lphTrades.length > 0 ? (lphTrades.filter(t => t.isWin).length / lphTrades.length) * 100 : 0
                },
                lpl: {
                    count: lplTrades.length,
                    totalPoints: lplTrades.reduce((sum, t) => sum + t.points, 0),
                    winRate: lplTrades.length > 0 ? (lplTrades.filter(t => t.isWin).length / lplTrades.length) * 100 : 0
                }
            },
            byExitRule: {
                stopLoss: {
                    count: stopLossExits.length,
                    totalPoints: stopLossExits.reduce((sum, t) => sum + t.points, 0)
                },
                eod: {
                    count: eodExits.length,
                    totalPoints: eodExits.reduce((sum, t) => sum + t.points, 0)
                }
            }
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TradeTracker = TradeTracker;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TradeTracker };
}
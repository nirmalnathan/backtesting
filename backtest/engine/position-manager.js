// backtest/engine/position-manager.js
// Manages position entry and exit logic

class PositionManager {
    constructor() {
        this.currentPositionId = 0;
    }
    
    // Enter a new position
    enterPosition(entryResult, barIndex, currentBar, tradeTracker) {
        this.currentPositionId++;
        
        // Calculate stop loss if enabled
        let stopLossLevel = null;
        if (window.ruleConfig.stopLoss) {
            const stopLossPercent = window.ruleConfig.stopLossPercent / 100;
            
            if (entryResult.direction === 'LONG') {
                stopLossLevel = entryResult.entryPrice - (entryResult.entryPrice * stopLossPercent);
            } else { // SHORT
                stopLossLevel = entryResult.entryPrice + (entryResult.entryPrice * stopLossPercent);
            }
        }
        
        // Create position object
        const position = {
            id: this.currentPositionId,
            direction: entryResult.direction,
            entryPrice: entryResult.entryPrice,
            entryBar: barIndex,
            entryTime: currentBar.datetime,
            entryRule: entryResult.entryType,
            stopLoss: stopLossLevel,
            tradedLevel: entryResult.tradedLevel,
            levelType: entryResult.levelType,
            
            // Position tracking for re-entry rules
            highestPrice: entryResult.direction === 'LONG' ? entryResult.entryPrice : null,
            lowestPrice: entryResult.direction === 'SHORT' ? entryResult.entryPrice : null,
            maxFavorableExcursion: 0,
            maxAdverseExcursion: 0
        };
        
        // Initialize trade tracking
        tradeTracker.startNewTrade(position);
        
        // Log entry
        const stopLossText = stopLossLevel ? 
            `Stop Loss: ${stopLossLevel.toFixed(2)} (${window.ruleConfig.stopLossPercent}%)` : 
            'Stop Loss: Disabled';
            
        console.log(`\n✅ POSITION ENTERED:`);
        console.log(`  ID: ${position.id}`);
        console.log(`  Direction: ${position.direction}`);
        console.log(`  Entry Price: ${position.entryPrice.toFixed(2)}`);
        console.log(`  Entry Bar: ${barIndex}`);
        console.log(`  Rule: ${position.entryRule}`);
        console.log(`  ${stopLossText}`);
        
        return position;
    }
    
    // Exit current position
    exitPosition(position, barIndex, currentBar, exitPrice, exitReason, tradeTracker) {
        // Calculate P&L
        let points;
        if (position.direction === 'LONG') {
            points = exitPrice - position.entryPrice;
        } else { // SHORT
            points = position.entryPrice - exitPrice;
        }
        
        const duration = barIndex - position.entryBar;
        
        // Complete the trade
        const completedTrade = tradeTracker.completeTrade(
            position,
            barIndex,
            currentBar,
            exitPrice,
            exitReason,
            points,
            duration
        );
        
        // Log exit
        console.log(`\n❌ POSITION EXITED:`);
        console.log(`  ID: ${position.id}`);
        console.log(`  Direction: ${position.direction}`);
        console.log(`  Exit Price: ${exitPrice.toFixed(2)}`);
        console.log(`  Exit Bar: ${barIndex}`);
        console.log(`  Points: ${points.toFixed(2)}`);
        console.log(`  Duration: ${duration} bars`);
        console.log(`  Reason: ${exitReason}`);
        console.log(`  Result: ${points > 0 ? 'WIN' : 'LOSS'}`);
        
        return completedTrade;
    }
    
    // Update position tracking (called each bar while in position)
    updatePositionTracking(position, currentBar) {
        if (!position) return;
        
        const currentPrice = currentBar.close;
        
        // Update highest/lowest reached
        if (position.direction === 'LONG') {
            if (currentBar.high > position.highestPrice) {
                position.highestPrice = currentBar.high;
            }
            
            // Calculate favorable/adverse excursion
            const favorableExcursion = currentBar.high - position.entryPrice;
            const adverseExcursion = position.entryPrice - currentBar.low;
            
            if (favorableExcursion > position.maxFavorableExcursion) {
                position.maxFavorableExcursion = favorableExcursion;
            }
            if (adverseExcursion > position.maxAdverseExcursion) {
                position.maxAdverseExcursion = adverseExcursion;
            }
            
        } else { // SHORT
            if (currentBar.low < position.lowestPrice) {
                position.lowestPrice = currentBar.low;
            }
            
            // Calculate favorable/adverse excursion
            const favorableExcursion = position.entryPrice - currentBar.low;
            const adverseExcursion = currentBar.high - position.entryPrice;
            
            if (favorableExcursion > position.maxFavorableExcursion) {
                position.maxFavorableExcursion = favorableExcursion;
            }
            if (adverseExcursion > position.maxAdverseExcursion) {
                position.maxAdverseExcursion = adverseExcursion;
            }
        }
    }
    
    // Get current position P&L (unrealized)
    getCurrentPnL(position, currentBar) {
        if (!position) return 0;
        
        const currentPrice = currentBar.close;
        
        if (position.direction === 'LONG') {
            return currentPrice - position.entryPrice;
        } else { // SHORT
            return position.entryPrice - currentPrice;
        }
    }
    
    // Get current position P&L percentage
    getCurrentPnLPercent(position, currentBar) {
        if (!position) return 0;
        
        const points = this.getCurrentPnL(position, currentBar);
        return (points / position.entryPrice) * 100;
    }
    
    // Check if position meets profit threshold (for aggressive trailing)
    meetsProfitThreshold(position, currentBar, thresholdPercent = 0.5) {
        const pnlPercent = Math.abs(this.getCurrentPnLPercent(position, currentBar));
        return pnlPercent >= thresholdPercent;
    }
    
    // Get position summary for debugging
    getPositionSummary(position, currentBar) {
        if (!position) return null;
        
        return {
            id: position.id,
            direction: position.direction,
            entryPrice: position.entryPrice,
            currentPrice: currentBar.close,
            unrealizedPnL: this.getCurrentPnL(position, currentBar),
            unrealizedPnLPercent: this.getCurrentPnLPercent(position, currentBar),
            highestPrice: position.highestPrice,
            lowestPrice: position.lowestPrice,
            maxFavorableExcursion: position.maxFavorableExcursion,
            maxAdverseExcursion: position.maxAdverseExcursion,
            stopLoss: position.stopLoss,
            entryRule: position.entryRule
        };
    }
    
    // Check if position should be closed based on risk management
    shouldForceExit(position, currentBar) {
        // Could implement additional risk management here
        // e.g., maximum position duration, maximum adverse excursion, etc.
        
        return false; // No forced exits implemented yet
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PositionManager = PositionManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PositionManager };
}
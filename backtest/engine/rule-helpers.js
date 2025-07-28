// backtest/engine/rule-helpers.js
// Helper utility functions for rule evaluation

class RuleHelpers {
    // Market tick size (NIFTY moves in 0.05 increments)
    static TICK_SIZE = 0.05;
    
    // Round price to nearest tick (0.05)
    static roundToTick(price) {
        return Math.round(price / this.TICK_SIZE) * this.TICK_SIZE;
    }
    
    // Round percentage-based price calculations to tick
    // For LONG: round down (more conservative entry)
    // For SHORT: round up (more conservative entry) 
    static roundPercentageToTick(basePrice, percentagePoints, isLong = true) {
        const rawPrice = basePrice + (isLong ? percentagePoints : -percentagePoints);
        
        if (isLong) {
            // LONG: Round down to be more conservative (lower entry)
            return Math.floor(rawPrice / this.TICK_SIZE) * this.TICK_SIZE;
        } else {
            // SHORT: Round up to be more conservative (higher entry)
            return Math.ceil(rawPrice / this.TICK_SIZE) * this.TICK_SIZE;
        }
    }
    // Helper: Get most recent pivot before current bar
    static getMostRecentPivot(pivotArray, currentBarIndex) {
        if (!pivotArray || pivotArray.length === 0) return null;
        
        let mostRecentPivot = null;
        let mostRecentIndex = -1;
        
        for (let i = 0; i < pivotArray.length; i++) {
            const pivotBarIndex = pivotArray[i];
            
            if (pivotBarIndex < currentBarIndex && pivotBarIndex > mostRecentIndex) {
                mostRecentIndex = pivotBarIndex;
                mostRecentPivot = {
                    barIndex: pivotBarIndex,
                    pivotIndex: i
                };
            }
        }
        
        return mostRecentPivot;
    }
    
    // Helper: Check if current bar is end of day
    static isEndOfDay(barIndex, currentBar, data) {
        // Last bar of dataset
        if (barIndex === data.length - 1) {
            return true;
        }
        
        // Next bar is different day
        const currentDate = new Date(currentBar.datetime).toDateString();
        const nextDate = new Date(data[barIndex + 1].datetime).toDateString();
        
        return currentDate !== nextDate;
    }
    
    // Helper: Get pivots that formed before position entry (for trailing stops)
    static getPivotsBeforeEntry(pivotArray, entryBarIndex, data) {
        if (!pivotArray || pivotArray.length === 0) return [];
        
        return pivotArray.filter(pivotBarIndex => pivotBarIndex < entryBarIndex);
    }
    
    // Helper: Calculate current P&L percentage
    static getCurrentPnLPercent(position, currentBar) {
        const currentPrice = currentBar.close;
        let pnlPoints;
        
        if (position.direction === 'LONG') {
            pnlPoints = currentPrice - position.entryPrice;
        } else { // SHORT
            pnlPoints = position.entryPrice - currentPrice;
        }
        
        return (pnlPoints / position.entryPrice) * 100;
    }
    
    // Helper: Find SPH pivots above a given level (for re-entry)
    static findSphAboveLevel(sphArray, data, level, currentBarIndex) {
        if (!sphArray || sphArray.length === 0) return [];
        
        const validSph = [];
        for (let sphBarIndex of sphArray) {
            if (sphBarIndex < currentBarIndex) {
                const sphHigh = data[sphBarIndex].high;
                if (sphHigh > level) {
                    validSph.push(sphBarIndex);
                }
            }
        }
        
        // Sort by bar index (chronological order)
        return validSph.sort((a, b) => a - b);
    }
    
    // Helper: Find SPL pivots below a given level (for re-entry)
    static findSplBelowLevel(splArray, data, level, currentBarIndex) {
        if (!splArray || splArray.length === 0) return [];
        
        const validSpl = [];
        for (let splBarIndex of splArray) {
            if (splBarIndex < currentBarIndex) {
                const splLow = data[splBarIndex].low;
                if (splLow < level) {
                    validSpl.push(splBarIndex);
                }
            }
        }
        
        // Sort by bar index (chronological order)
        return validSpl.sort((a, b) => a - b);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RuleHelpers = RuleHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleHelpers };
}
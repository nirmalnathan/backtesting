// backtest/rules/exit-rules/stop-exit-rules.js
// Exit rules for stop losses

const STOP_EXIT_RULES = {
    // Existing stop loss rule
    stopLossExit: {
        id: 'stopLossExit',
        label: 'Fixed Stop Loss Exit',
        category: 'stop-exit',
        implemented: true,
        
        evaluate: function(position, barIndex, currentBar, data) {
            return window.stopLossRule?.evaluate(position, barIndex, currentBar, data);
        }
    },
    
    
    // Ready for more stop exit rules:
    // - ATR-based stops
    // - Pivot-based stops
    // - Percentage-based stops
    // - Breakeven stops
};

// Export for use in rule processor
if (typeof window !== 'undefined') {
    window.STOP_EXIT_RULES = STOP_EXIT_RULES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STOP_EXIT_RULES };
}
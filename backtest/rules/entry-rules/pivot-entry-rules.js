// backtest/rules/entry-rules/pivot-entry-rules.js
// Entry rules based on pivot levels (LPH/LPL breaks)

const PIVOT_ENTRY_RULES = {
    // Existing LPH/LPL break entry rule
    entryLphLpl: {
        id: 'entryLphLpl',
        label: 'LPH Break Entry (LONG above LPH, SHORT below LPL)',
        category: 'pivot-entry',
        implemented: true,
        
        evaluate: function(barIndex, currentBar, data, pivots, levelStates) {
            return window.entryLphLplRule?.evaluate(barIndex, currentBar, data, pivots, levelStates);
        }
    },
    
    // Placeholder for SPH above LPH rule
    entrySphAboveLph: {
        id: 'entrySphAboveLph',
        label: 'Long on SPH above LPH or long on any SPH above LPL',
        category: 'pivot-entry',
        implemented: false,
        
        evaluate: function(barIndex, currentBar, data, pivots, levelStates) {
            // TODO: Implement in future session
            return { shouldEnter: false };
        }
    }
    
    // Ready for more pivot-based entry rules:
    // - SPL below LPL entries
    // - Multiple pivot confirmation entries  
    // - Pivot confluence entries
    // - Pivot retest entries
};

// Export for use in rule processor
if (typeof window !== 'undefined') {
    window.PIVOT_ENTRY_RULES = PIVOT_ENTRY_RULES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PIVOT_ENTRY_RULES };
}
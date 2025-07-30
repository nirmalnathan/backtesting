// backtest/rules/rule-definitions.js
// Central definition of all trading rules with metadata

const RULE_DEFINITIONS = {
    entryRules: {
        entryLphLpl: {
            id: 'entryLphLpl',
            label: 'LPH Break Entry (LONG above LPH, SHORT below LPL)',
            type: 'checkbox',
            defaultValue: true,
            category: 'entry',
            description: 'Enter LONG when price breaks above LPH, SHORT when price breaks below LPL',
            implemented: true
        },
        entrySphAboveLph: {
            id: 'entrySphAboveLph',
            label: 'SPH Above LPH Re-entry (After Stop-out)',
            type: 'checkbox',
            defaultValue: false,
            category: 'entry',
            description: 'Re-enter LONG on SPH above original LPH after being stopped out, SHORT on SPL below original LPL',
            implemented: true,
            dependencies: ['entryLphLpl']
        },
    },
    
    exitRules: {
        stopLoss: {
            id: 'stopLoss',
            label: 'Stop Loss',
            type: 'checkbox-with-input',
            defaultValue: true,
            category: 'exit',
            description: 'Fixed percentage stop loss against position',
            implemented: true,
            inputConfig: {
                id: 'stopLossPercent',
                type: 'number',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                defaultValue: 0.3,
                suffix: '% against position'
            }
        },
        eodExit: {
            id: 'eodExit',
            label: 'End of Day Exit (Mandatory close at day end)',
            type: 'checkbox',
            defaultValue: true,
            category: 'exit',
            description: 'Force exit all positions at end of trading day',
            implemented: true
        },
        trailingSpl: {
            id: 'trailingSpl',
            label: 'Trailing SL = SPL for LONG, SPH for SHORT',
            type: 'checkbox',
            defaultValue: false,
            category: 'exit',
            description: 'Trail stop loss to the most recent SPL level before entry for LONG, SPH level before entry for SHORT',
            implemented: true
        },
        aggressiveProfit: {
            id: 'aggressiveProfit',
            label: 'Enhanced Aggressive Trailing (Continuous Best Level)',
            type: 'checkbox-with-input',
            defaultValue: false,
            category: 'exit',
            description: 'Trail to best profitable previous bar level, ensures minimum profit percentage on exit',
            implemented: true,
            inputConfig: {
                id: 'aggressiveProfitPercent',
                type: 'number',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                defaultValue: 0.5,
                suffix: '% profit threshold'
            }
        },
    },
    
    specialFeatures: {
        gapHandling: {
            id: 'gapHandling',
            label: 'Gap Handling (Enter at market open if gap beyond trigger)',
            type: 'checkbox',
            defaultValue: true,
            category: 'special',
            description: 'Handle gap openings above LPH or below LPL',
            implemented: true
        },
        dailyReset: {
            id: 'dailyReset',
            label: 'Daily Reset (Fresh start each day, no re-trading levels)',
            type: 'checkbox',
            defaultValue: true,
            category: 'special',
            description: 'Reset traded levels each day vs keeping them across days',
            implemented: true
        }
    }
};

// Helper functions
function getRulesByCategory(category) {
    switch(category) {
        case 'entry': return RULE_DEFINITIONS.entryRules;
        case 'exit': return RULE_DEFINITIONS.exitRules;
        case 'special': return RULE_DEFINITIONS.specialFeatures;
        default: return {};
    }
}

function getImplementedRules() {
    const implemented = {};
    
    Object.keys(RULE_DEFINITIONS).forEach(category => {
        implemented[category] = {};
        Object.keys(RULE_DEFINITIONS[category]).forEach(ruleId => {
            const rule = RULE_DEFINITIONS[category][ruleId];
            if (rule.implemented) {
                implemented[category][ruleId] = rule;
            }
        });
    });
    
    return implemented;
}

function getAllRuleIds() {
    const allIds = [];
    
    Object.keys(RULE_DEFINITIONS).forEach(category => {
        Object.keys(RULE_DEFINITIONS[category]).forEach(ruleId => {
            allIds.push(ruleId);
        });
    });
    
    return allIds;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RULE_DEFINITIONS = RULE_DEFINITIONS;
    window.getRulesByCategory = getRulesByCategory;
    window.getImplementedRules = getImplementedRules;
    window.getAllRuleIds = getAllRuleIds;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RULE_DEFINITIONS,
        getRulesByCategory,
        getImplementedRules,
        getAllRuleIds
    };
}
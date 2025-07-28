// backtest/engine/rule-validator.js
// Rule validation and configuration checking

class RuleValidator {
    constructor() {
        // Validation cache to avoid repeated checks
        this.validationCache = new Map();
    }
    
    // Validate rule configuration
    validateRuleConfig(ruleConfig) {
        if (!ruleConfig) {
            throw new Error('No rule configuration provided');
        }
        
        const validationResults = {
            isValid: true,
            errors: [],
            warnings: []
        };
        
        // Check entry rules
        const entryRuleResults = this.validateEntryRules(ruleConfig);
        validationResults.errors.push(...entryRuleResults.errors);
        validationResults.warnings.push(...entryRuleResults.warnings);
        
        // Check exit rules
        const exitRuleResults = this.validateExitRules(ruleConfig);
        validationResults.errors.push(...exitRuleResults.errors);
        validationResults.warnings.push(...exitRuleResults.warnings);
        
        // Check parameter consistency
        const paramResults = this.validateParameters(ruleConfig);
        validationResults.errors.push(...paramResults.errors);
        validationResults.warnings.push(...paramResults.warnings);
        
        validationResults.isValid = validationResults.errors.length === 0;
        
        return validationResults;
    }
    
    // Validate entry rules configuration
    validateEntryRules(ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        // Check if at least one entry rule is enabled
        const enabledEntryRules = this.getEnabledRules(ruleConfig, 'entryRules');
        
        if (enabledEntryRules.length === 0) {
            results.errors.push('No entry rules enabled - backtest cannot proceed');
        }
        
        // Validate individual entry rules
        enabledEntryRules.forEach(ruleId => {
            const ruleValidation = this.validateIndividualRule(ruleId, 'entry', ruleConfig);
            results.errors.push(...ruleValidation.errors);
            results.warnings.push(...ruleValidation.warnings);
        });
        
        return results;
    }
    
    // Validate exit rules configuration
    validateExitRules(ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        // Check if at least one exit rule is enabled
        const enabledExitRules = this.getEnabledRules(ruleConfig, 'exitRules');
        
        if (enabledExitRules.length === 0) {
            results.warnings.push('No exit rules enabled - positions may run indefinitely');
        }
        
        // Validate individual exit rules
        enabledExitRules.forEach(ruleId => {
            const ruleValidation = this.validateIndividualRule(ruleId, 'exit', ruleConfig);
            results.errors.push(...ruleValidation.errors);
            results.warnings.push(...ruleValidation.warnings);
        });
        
        return results;
    }
    
    // Validate parameters consistency
    validateParameters(ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        // Validate stop loss parameters
        if (ruleConfig.stopLoss && ruleConfig.stopLossPercent) {
            if (ruleConfig.stopLossPercent <= 0 || ruleConfig.stopLossPercent > 100) {
                results.errors.push(`Invalid stop loss percentage: ${ruleConfig.stopLossPercent}% (must be 0-100)`);
            }
            
            if (ruleConfig.stopLossPercent > 20) {
                results.warnings.push(`High stop loss percentage: ${ruleConfig.stopLossPercent}% (consider lower values)`);
            }
        }
        
        // Validate aggressive profit parameters
        if (ruleConfig.aggressiveProfit && ruleConfig.aggressiveProfitPercent) {
            if (ruleConfig.aggressiveProfitPercent <= 0 || ruleConfig.aggressiveProfitPercent > 100) {
                results.errors.push(`Invalid aggressive profit percentage: ${ruleConfig.aggressiveProfitPercent}% (must be 0-100)`);
            }
        }
        
        // Check for conflicting rules
        const conflictResults = this.checkRuleConflicts(ruleConfig);
        results.errors.push(...conflictResults.errors);
        results.warnings.push(...conflictResults.warnings);
        
        return results;
    }
    
    // Validate individual rule
    validateIndividualRule(ruleId, ruleType, ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        // Check if rule is defined in RULE_DEFINITIONS
        if (!this.isRuleDefined(ruleId, ruleType)) {
            results.errors.push(`Rule '${ruleId}' is not defined in RULE_DEFINITIONS`);
            return results;
        }
        
        // Check if rule is implemented
        if (!this.isRuleImplemented(ruleId, ruleType)) {
            results.warnings.push(`Rule '${ruleId}' is enabled but not implemented`);
        }
        
        // Validate rule-specific parameters
        const paramValidation = this.validateRuleParameters(ruleId, ruleConfig);
        results.errors.push(...paramValidation.errors);
        results.warnings.push(...paramValidation.warnings);
        
        return results;
    }
    
    // Check for rule conflicts
    checkRuleConflicts(ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        // Example: Check if both trailing and fixed stop loss are enabled
        if (ruleConfig.stopLoss && ruleConfig.trailingSpl) {
            results.warnings.push('Both fixed stop loss and trailing stop are enabled - trailing stop will take precedence');
        }
        
        // Check if aggressive profit conflicts with other exits
        if (ruleConfig.aggressiveProfit && (ruleConfig.trailingSpl || ruleConfig.trailingLpl)) {
            results.warnings.push('Aggressive profit trailing enabled with other trailing stops - may cause conflicting exits');
        }
        
        return results;
    }
    
    // Validate rule-specific parameters
    validateRuleParameters(ruleId, ruleConfig) {
        const results = { errors: [], warnings: [] };
        
        switch (ruleId) {
            case 'stopLoss':
                if (!ruleConfig.stopLossPercent) {
                    results.errors.push('Stop loss enabled but stopLossPercent not configured');
                }
                break;
                
            case 'aggressiveProfit':
                if (!ruleConfig.aggressiveProfitPercent) {
                    results.errors.push('Aggressive profit enabled but aggressiveProfitPercent not configured');
                }
                break;
                
            // Add more rule-specific validations as needed
        }
        
        return results;
    }
    
    // Get enabled rules from configuration
    getEnabledRules(ruleConfig, category) {
        if (!window.RULE_DEFINITIONS || !window.RULE_DEFINITIONS[category]) {
            return [];
        }
        
        const categoryRules = window.RULE_DEFINITIONS[category];
        const enabledRules = [];
        
        Object.keys(categoryRules).forEach(ruleId => {
            if (ruleConfig[ruleId] === true) {
                enabledRules.push(ruleId);
            }
        });
        
        return enabledRules;
    }
    
    // Check if rule is defined in RULE_DEFINITIONS
    isRuleDefined(ruleId, ruleType) {
        if (!window.RULE_DEFINITIONS) return false;
        
        const category = ruleType === 'entry' ? 'entryRules' : 'exitRules';
        const categoryRules = window.RULE_DEFINITIONS[category];
        
        return categoryRules && categoryRules[ruleId] !== undefined;
    }
    
    // Check if rule is implemented
    isRuleImplemented(ruleId, ruleType) {
        if (!window.RULE_DEFINITIONS) return false;
        
        const category = ruleType === 'entry' ? 'entryRules' : 'exitRules';
        const categoryRules = window.RULE_DEFINITIONS[category];
        
        return categoryRules && categoryRules[ruleId] && categoryRules[ruleId].implemented === true;
    }
    
    // Get all implemented rules for a category
    getImplementedRules(category) {
        if (!window.RULE_DEFINITIONS) {
            console.error('RULE_DEFINITIONS not loaded');
            return {};
        }
        
        const categoryRules = window.RULE_DEFINITIONS[category];
        if (!categoryRules) return {};
        
        const implementedRules = {};
        Object.keys(categoryRules).forEach(ruleId => {
            const rule = categoryRules[ruleId];
            if (rule.implemented) {
                implementedRules[ruleId] = rule;
            }
        });
        
        return implementedRules;
    }
    
    // Validate data requirements for rules
    validateDataRequirements(ruleConfig, data, pivots) {
        const results = { errors: [], warnings: [] };
        
        // Check basic data availability
        if (!data || data.length === 0) {
            results.errors.push('No chart data available for backtesting');
            return results;
        }
        
        if (!pivots) {
            results.errors.push('No pivot data available for backtesting');
            return results;
        }
        
        // Check pivot-dependent rules
        const pivotDependentRules = ['entryLphLpl', 'entrySphAboveLph', 'trailingSpl', 'trailingLpl'];
        const enabledPivotRules = pivotDependentRules.filter(ruleId => ruleConfig[ruleId]);
        
        if (enabledPivotRules.length > 0) {
            if (!pivots.lph || pivots.lph.length === 0) {
                results.warnings.push('LPH pivot-dependent rules enabled but no LPH pivots found');
            }
            
            if (!pivots.lpl || pivots.lpl.length === 0) {
                results.warnings.push('LPL pivot-dependent rules enabled but no LPL pivots found');
            }
        }
        
        return results;
    }
    
    // Get validation summary
    getValidationSummary(validationResults) {
        return {
            status: validationResults.isValid ? 'VALID' : 'INVALID',
            errorCount: validationResults.errors.length,
            warningCount: validationResults.warnings.length,
            canProceed: validationResults.errors.length === 0
        };
    }
    
    // Clear validation cache
    clearValidationCache() {
        this.validationCache.clear();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RuleValidator = RuleValidator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleValidator };
}
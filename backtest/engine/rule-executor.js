// backtest/engine/rule-executor.js
// Rule execution and orchestration - coordinates rule evaluation and execution

class RuleExecutor {
    constructor() {
        this.ruleEvaluator = new RuleEvaluator();
        this.ruleValidator = new RuleValidator();
    }
    
    // Process all entry rules dynamically
    processEntries(barIndex, currentBar, data, pivots, levelStates) {
        const config = window.ruleConfig;
        
        // Get all implemented entry rules from definitions
        const implementedEntryRules = this.ruleValidator.getImplementedRules('entryRules');
        
        // Process each implemented entry rule
        for (const ruleId of Object.keys(implementedEntryRules)) {
            // Check if rule is enabled in config
            if (!config[ruleId]) continue;
            
            // Evaluate the rule
            const result = this.ruleEvaluator.evaluateEntryRule(
                ruleId,
                barIndex, 
                currentBar, 
                data, 
                pivots, 
                levelStates
            );
            
            if (result.shouldEnter) {
                console.log(`✅ ENTRY: ${result.direction} at Bar ${barIndex} - ${result.entryType}`);
                return result;
            }
        }
        
        return { shouldEnter: false };
    }
    
    // Process all exit rules dynamically - evaluate ALL rules and choose best exit
    processExits(position, barIndex, currentBar, data) {
        const config = window.ruleConfig;
        
        // Get all implemented exit rules from definitions
        const implementedExitRules = this.ruleValidator.getImplementedRules('exitRules');
        
        let bestExit = null;
        const allExitResults = [];
        
        // Evaluate ALL implemented exit rules
        for (const ruleId of Object.keys(implementedExitRules)) {
            // Check if rule is enabled in config
            if (!config[ruleId]) continue;
            
            // Prepare parameters for the rule
            const params = this.prepareRuleParameters(ruleId, config);
            
            // Evaluate the rule
            const result = this.ruleEvaluator.evaluateExitRule(
                ruleId,
                position, 
                barIndex, 
                currentBar, 
                data,
                params
            );
            
            if (result.shouldExit) {
                allExitResults.push({...result, ruleId});
                
                // Choose the best exit based on position direction
                if (!bestExit || this.isBetterExit(result, bestExit, position.direction)) {
                    bestExit = {...result, ruleId};
                }
            }
        }
        
        // Log all potential exits for debugging
        if (allExitResults.length > 1) {
            console.log(`🎯 Multiple exit signals at bar ${barIndex}:`);
            allExitResults.forEach(exit => {
                console.log(`  - ${exit.ruleId}: ${exit.exitPrice} (${exit.exitReason})`);
            });
            console.log(`  → Chose: ${bestExit.ruleId} at ${bestExit.exitPrice}`);
        }
        
        if (bestExit) {
            console.log(`❌ EXIT: ${bestExit.exitReason}`);
            return bestExit;
        }
        
        return { shouldExit: false };
    }
    
    // Prepare rule-specific parameters
    prepareRuleParameters(ruleId, config) {
        const params = {};
        
        switch (ruleId) {
            case 'stopLoss':
                params.stopLossPercent = config.stopLossPercent;
                break;
                
            case 'aggressiveProfit':
                params.aggressiveProfitPercent = config.aggressiveProfitPercent;
                break;
                
            case 'trailingSpl':
                params.pivots = window.pivotData;
                break;
                
            case 'trailingLpl':
                params.pivots = window.pivotData;
                break;
                
            // Add more rule-specific parameter preparation as needed
        }
        
        return params;
    }
    
    // Determine if one exit is better than another based on position direction
    isBetterExit(newExit, currentBest, direction) {
        // For LONG positions: Higher exit price is better (more profit/less loss)
        // For SHORT positions: Lower exit price is better (more profit/less loss)
        if (direction === 'LONG') {
            return newExit.exitPrice > currentBest.exitPrice;
        } else { // SHORT
            return newExit.exitPrice < currentBest.exitPrice;
        }
    }
    
    // Validate configuration before processing
    validateConfiguration() {
        const validationResults = this.ruleValidator.validateRuleConfig(window.ruleConfig);
        
        if (!validationResults.isValid) {
            console.error('Rule configuration validation failed:');
            validationResults.errors.forEach(error => console.error(`  - ${error}`));
            throw new Error('Invalid rule configuration');
        }
        
        if (validationResults.warnings.length > 0) {
            console.warn('Rule configuration warnings:');
            validationResults.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }
        
        return validationResults;
    }
    
    // Validate data requirements
    validateDataRequirements(data, pivots) {
        const validationResults = this.ruleValidator.validateDataRequirements(
            window.ruleConfig, 
            data, 
            pivots
        );
        
        if (validationResults.errors.length > 0) {
            console.error('Data requirements validation failed:');
            validationResults.errors.forEach(error => console.error(`  - ${error}`));
            throw new Error('Invalid data for rule processing');
        }
        
        if (validationResults.warnings.length > 0) {
            console.warn('Data requirements warnings:');
            validationResults.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }
        
        return validationResults;
    }
    
    // Get execution statistics
    getExecutionStats() {
        const config = window.ruleConfig;
        const enabledEntryRules = this.ruleValidator.getEnabledRules(config, 'entryRules');
        const enabledExitRules = this.ruleValidator.getEnabledRules(config, 'exitRules');
        
        return {
            enabledEntryRules: enabledEntryRules.length,
            enabledExitRules: enabledExitRules.length,
            totalEnabledRules: enabledEntryRules.length + enabledExitRules.length,
            entryRuleNames: enabledEntryRules,
            exitRuleNames: enabledExitRules
        };
    }
    
    // Test rule execution (for debugging)
    testRuleExecution(ruleId, ruleType, testParams) {
        try {
            let result;
            
            if (ruleType === 'entry') {
                result = this.ruleEvaluator.evaluateEntryRule(
                    ruleId,
                    testParams.barIndex,
                    testParams.currentBar,
                    testParams.data,
                    testParams.pivots,
                    testParams.levelStates
                );
            } else {
                result = this.ruleEvaluator.evaluateExitRule(
                    ruleId,
                    testParams.position,
                    testParams.barIndex,
                    testParams.currentBar,
                    testParams.data,
                    testParams.params || {}
                );
            }
            
            return {
                success: true,
                result: result,
                ruleId: ruleId,
                ruleType: ruleType
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                ruleId: ruleId,
                ruleType: ruleType
            };
        }
    }
    
    // Get rule execution order
    getRuleExecutionOrder() {
        const config = window.ruleConfig;
        
        return {
            entryRules: this.ruleValidator.getEnabledRules(config, 'entryRules'),
            exitRules: this.ruleValidator.getEnabledRules(config, 'exitRules')
        };
    }
    
    // Initialize rule executor
    initialize() {
        try {
            // Validate configuration
            this.validateConfiguration();
            
            // Get execution stats
            const stats = this.getExecutionStats();
            console.log(`Rule Executor initialized: ${stats.totalEnabledRules} rules enabled`);
            console.log(`  Entry rules: ${stats.entryRuleNames.join(', ')}`);
            console.log(`  Exit rules: ${stats.exitRuleNames.join(', ')}`);
            
            return true;
            
        } catch (error) {
            console.error('Rule Executor initialization failed:', error);
            throw error;
        }
    }
}

// Maintain backward compatibility with old RuleProcessor class
class RuleProcessor extends RuleExecutor {
    constructor() {
        super();
        console.log('RuleProcessor created (using RuleExecutor implementation)');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RuleExecutor = RuleExecutor;
    window.RuleProcessor = RuleProcessor; // Backward compatibility
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleExecutor, RuleProcessor };
}
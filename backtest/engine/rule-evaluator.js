// backtest/engine/rule-evaluator.js
// Core rule evaluation logic - evaluates individual rule conditions

class RuleEvaluator {
    constructor() {
        // Rule method mapping for dynamic execution
        this.entryMethodMap = {
            'entryLphLpl': 'evaluateLphLplEntry',
            'entrySphAboveLph': 'evaluateSphAboveLphEntry',
            'reentryAboveHigh': 'evaluateReentryAboveHigh'
        };
        
        this.exitMethodMap = {
            'stopLoss': 'evaluateStopLoss',
            'eodExit': 'evaluateEodExit',
            'trailingSpl': 'evaluateTrailingSpl',
            'trailingLpl': 'evaluateTrailingLpl',
            'aggressiveProfit': 'evaluateAggressiveProfit'
        };
    }
    
    // Evaluate entry rule by ID
    evaluateEntryRule(ruleId, barIndex, currentBar, data, pivots, levelStates) {
        const methodName = this.entryMethodMap[ruleId];
        if (methodName && typeof this[methodName] === 'function') {
            return this[methodName](barIndex, currentBar, data, pivots, levelStates);
        }
        
        if (window.debugLogger) {
            window.debugLogger.error(`Entry rule method not found: ${ruleId}`);
        }
        console.warn(`Entry rule method not found: ${ruleId}`);
        return { shouldEnter: false };
    }
    
    // Evaluate exit rule by ID
    evaluateExitRule(ruleId, position, barIndex, currentBar, data, params = {}) {
        const methodName = this.exitMethodMap[ruleId];
        if (methodName && typeof this[methodName] === 'function') {
            return this[methodName](position, barIndex, currentBar, data, params);
        }
        
        if (window.debugLogger) {
            window.debugLogger.error(`Exit rule method not found: ${ruleId}`);
        }
        console.warn(`Exit rule method not found: ${ruleId}`);
        return { shouldExit: false };
    }
    
    // Entry Rule: LPH/LPL Break Entry (IMPLEMENTED)
    evaluateLphLplEntry(barIndex, currentBar, data, pivots, levelStates) {
        // Log pivot data for debugging
        if (window.debugLogger && barIndex % 10 === 0) { // Log every 10th bar to avoid spam
            window.debugLogger.pivot(`Bar ${barIndex}: Available pivots`, {
                lphCount: pivots.lph?.length || 0,
                lplCount: pivots.lpl?.length || 0,
                lphValues: pivots.lph?.map(idx => data[idx]?.high).slice(-3) || [],
                lplValues: pivots.lpl?.map(idx => data[idx]?.low).slice(-3) || []
            });
        }
        
        // Get most recent LPH and LPL
        const recentLPH = RuleHelpers.getMostRecentPivot(pivots.lph, barIndex);
        const recentLPL = RuleHelpers.getMostRecentPivot(pivots.lpl, barIndex);
        
        if (!recentLPH && !recentLPL) {
            if (window.debugLogger && barIndex === 52) { // Special logging for bar 52
                window.debugLogger.pivot(`Bar ${barIndex}: No recent pivots found`, {
                    totalLph: pivots.lph?.length || 0,
                    totalLpl: pivots.lpl?.length || 0
                });
            }
            return { shouldEnter: false };
        }
        
        // Special logging for bar 52 to debug the missing trade
        if (window.debugLogger && barIndex === 52) {
            window.debugLogger.pivot(`Bar 52: Pivot analysis`, {
                recentLPH: recentLPH ? {
                    barIndex: recentLPH.barIndex,
                    value: data[recentLPH.barIndex]?.high
                } : null,
                recentLPL: recentLPL ? {
                    barIndex: recentLPL.barIndex,
                    value: data[recentLPL.barIndex]?.low
                } : null,
                currentBarOpen: currentBar.open,
                currentBarLow: currentBar.low,
                currentBarHigh: currentBar.high
            });
        }
        
        // Check LPH break for LONG entry
        if (recentLPH) {
            const lphHigh = data[recentLPH.barIndex].high;
            const levelKey = `LPH_${lphHigh.toFixed(2)}`;
            
            // Check level state (new re-entry logic)
            const levelState = levelStates.get(levelKey);
            const canTrade = !levelState || levelState.status === 'available';
            
            if (window.debugLogger) {
                window.debugLogger.entry(`LPH ${lphHigh.toFixed(2)} - Status: ${levelState?.status || 'new'}, Can trade: ${canTrade}`, {
                    level: lphHigh,
                    status: levelState?.status,
                    canTrade,
                    barIndex,
                    currentBar: { open: currentBar.open, high: currentBar.high }
                });
            }
            
            // Check for breakout
            if (canTrade && currentBar.high > lphHigh) {
                let entryPrice, entryType;
                
                // Gap handling
                if (window.ruleConfig.gapHandling && currentBar.open > lphHigh) {
                    entryPrice = currentBar.open;
                    entryType = `LONG LPH GAP entry (LPH=${lphHigh.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                } else {
                    entryPrice = lphHigh + RuleHelpers.TICK_SIZE;
                    entryType = `LONG LPH breakout entry (${lphHigh.toFixed(2)} + 1 tick)`;
                }
                
                return {
                    shouldEnter: true,
                    direction: 'LONG',
                    entryPrice: entryPrice,
                    entryType: entryType,
                    tradedLevel: lphHigh,
                    levelType: 'LPH',
                    barIndex: barIndex
                };
            }
        }
        
        // Check LPL break for SHORT entry
        if (recentLPL) {
            const lplLow = data[recentLPL.barIndex].low;
            const levelKey = `LPL_${lplLow.toFixed(2)}`;
            
            // Check level state (new re-entry logic)
            const levelState = levelStates.get(levelKey);
            const canTrade = !levelState || levelState.status === 'available';
            
            if (window.debugLogger) {
                window.debugLogger.entry(`LPL ${lplLow.toFixed(2)} - Status: ${levelState?.status || 'new'}, Can trade: ${canTrade}`, {
                    level: lplLow,
                    status: levelState?.status,
                    canTrade,
                    barIndex,
                    currentBar: { open: currentBar.open, low: currentBar.low }
                });
            }
            
            // Check for breakdown
            if (canTrade && currentBar.low < lplLow) {
                let entryPrice, entryType;
                
                // Gap handling
                if (window.ruleConfig.gapHandling && currentBar.open < lplLow) {
                    entryPrice = currentBar.open;
                    entryType = `SHORT LPL GAP entry (LPL=${lplLow.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                } else {
                    entryPrice = lplLow - RuleHelpers.TICK_SIZE;
                    entryType = `SHORT LPL breakdown entry (${lplLow.toFixed(2)} - 1 tick)`;
                }
                
                return {
                    shouldEnter: true,
                    direction: 'SHORT',
                    entryPrice: entryPrice,
                    entryType: entryType,
                    tradedLevel: lplLow,
                    levelType: 'LPL',
                    barIndex: barIndex
                };
            }
        }
        
        return { shouldEnter: false };
    }
    
    // Entry Rule: SPH above LPH re-entry (IMPLEMENTED)
    evaluateSphAboveLphEntry(barIndex, currentBar, data, pivots, levelStates) {
        // Must not be in trade (only after stop-out)
        if (levelStates.has('currentPosition')) {
            return { shouldEnter: false };
        }
        
        // Must have previous LPH/LPL trade that was stopped out
        const lastStoppedTrade = levelStates.get('lastStoppedTrade');
        if (!lastStoppedTrade || !['LPH', 'LPL'].includes(lastStoppedTrade.levelType)) {
            return { shouldEnter: false };
        }
        
        const originalLevel = lastStoppedTrade.tradedLevel;
        const originalDirection = lastStoppedTrade.direction;
        
        if (originalDirection === 'LONG') {
            // Look for SPH above original LPH
            const sphAboveLph = RuleHelpers.findSphAboveLevel(pivots.sph, data, originalLevel, barIndex);
            
            if (sphAboveLph.length > 0) {
                // Check for previous SPH retest or new SPH formation
                for (let sphBarIndex of sphAboveLph) {
                    const sphLevel = data[sphBarIndex].high;
                    const levelKey = `SPH_${sphLevel.toFixed(2)}`;
                    
                    // Check level state
                    const levelState = levelStates.get(levelKey);
                    const canTrade = !levelState || levelState.status === 'available';
                    
                    if (canTrade) {
                        // Entry condition: price breaks above SPH level
                        if (currentBar.high > sphLevel) {
                            let entryPrice, entryType;
                            
                            // Gap handling
                            if (window.ruleConfig.gapHandling && currentBar.open > sphLevel) {
                                entryPrice = currentBar.open;
                                entryType = `LONG SPH GAP re-entry (SPH=${sphLevel.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                            } else {
                                entryPrice = sphLevel + RuleHelpers.TICK_SIZE;
                                entryType = `LONG SPH re-entry above LPH (${sphLevel.toFixed(2)} + 1 tick)`;
                            }
                            
                            return {
                                shouldEnter: true,
                                direction: 'LONG',
                                entryPrice: entryPrice,
                                entryType: entryType,
                                tradedLevel: sphLevel,
                                levelType: 'SPH',
                                barIndex: barIndex,
                                originalLph: originalLevel
                            };
                        }
                    }
                }
            }
            
        } else { // SHORT - SPL below original LPL
            const splBelowLpl = RuleHelpers.findSplBelowLevel(pivots.spl, data, originalLevel, barIndex);
            
            if (splBelowLpl.length > 0) {
                // Check for previous SPL retest or new SPL formation
                for (let splBarIndex of splBelowLpl) {
                    const splLevel = data[splBarIndex].low;
                    const levelKey = `SPL_${splLevel.toFixed(2)}`;
                    
                    // Check level state
                    const levelState = levelStates.get(levelKey);
                    const canTrade = !levelState || levelState.status === 'available';
                    
                    if (canTrade) {
                        // Entry condition: price breaks below SPL level
                        if (currentBar.low < splLevel) {
                            let entryPrice, entryType;
                            
                            // Gap handling
                            if (window.ruleConfig.gapHandling && currentBar.open < splLevel) {
                                entryPrice = currentBar.open;
                                entryType = `SHORT SPL GAP re-entry (SPL=${splLevel.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                            } else {
                                entryPrice = splLevel - RuleHelpers.TICK_SIZE;
                                entryType = `SHORT SPL re-entry below LPL (${splLevel.toFixed(2)} - 1 tick)`;
                            }
                            
                            return {
                                shouldEnter: true,
                                direction: 'SHORT',
                                entryPrice: entryPrice,
                                entryType: entryType,
                                tradedLevel: splLevel,
                                levelType: 'SPL',
                                barIndex: barIndex,
                                originalLpl: originalLevel
                            };
                        }
                    }
                }
            }
        }
        
        return { shouldEnter: false };
    }
    
    // Entry Rule: Re-entry above recent high (NOT IMPLEMENTED)
    evaluateReentryAboveHigh(barIndex, currentBar, data, pivots, levelStates) {
        // Placeholder for future implementation
        return { shouldEnter: false };
    }
    
    // Helper: Check if stop loss should be hit based on gap-aware intrabar logic
    shouldStopBeHit(position, currentBar, stopLevel) {
        const isBearishBar = currentBar.close < currentBar.open;
        const isBullishBar = currentBar.close > currentBar.open;
        const isGapEntry = Math.abs(position.entryPrice - currentBar.open) < 0.01; // Entry at open (gap entry)
        
        if (window.debugLogger) {
            window.debugLogger.exit(`Intrabar analysis`, {
                barType: isBearishBar ? 'BEARISH' : 'BULLISH',
                direction: position.direction,
                isGapEntry,
                entryPrice: position.entryPrice,
                barOpen: currentBar.open,
                stopLevel,
                barHigh: currentBar.high,
                barLow: currentBar.low
            });
        }
        
        // Gap entries: Entry at open, so high/low can occur AFTER entry
        if (isGapEntry) {
            const stopHit = position.direction === 'LONG' ? 
                currentBar.low <= stopLevel : currentBar.high >= stopLevel;
            
            if (window.debugLogger) {
                window.debugLogger.exit(`Gap entry logic: ${stopHit ? 'Stop hit' : 'Stop avoided'}`, {
                    entryType: 'GAP',
                    stopHit
                });
            }
            return stopHit;
        }
        
        // Normal entries: Check if bar trend matches position direction
        if (position.direction === 'SHORT' && isBearishBar) {
            // Bearish bar + SHORT: Open(high) → trend down → entry after breakdown
            // High occurred BEFORE entry, stop unlikely to be hit
            if (window.debugLogger) {
                window.debugLogger.exit(`Bearish bar + SHORT: Stop avoided (high occurred before entry)`);
            }
            return false;
        }
        
        if (position.direction === 'LONG' && isBullishBar) {
            // Bullish bar + LONG: Open(low) → trend up → entry after breakout
            // Low occurred BEFORE entry, stop unlikely to be hit
            if (window.debugLogger) {
                window.debugLogger.exit(`Bullish bar + LONG: Stop avoided (low occurred before entry)`);
            }
            return false;
        }
        
        // All other cases: Use traditional stop logic
        const stopHit = position.direction === 'LONG' ? 
            currentBar.low <= stopLevel : currentBar.high >= stopLevel;
            
        if (window.debugLogger) {
            window.debugLogger.exit(`Traditional stop logic: ${stopHit ? 'Stop hit' : 'Stop avoided'}`, {
                reason: 'Mixed bar type and direction'
            });
        }
            
        return stopHit;
    }
    
    // Exit Rule: Stop Loss (IMPLEMENTED) - With Gap-Aware Intrabar Logic
    evaluateStopLoss(position, barIndex, currentBar, data, params) {
        const stopLossPercent = params.stopLossPercent || window.ruleConfig.stopLossPercent;
        const stopLossDecimal = stopLossPercent / 100;
        
        if (position.direction === 'LONG') {
            const stopLossPoints = position.entryPrice * stopLossDecimal;
            const stopLossLevel = RuleHelpers.roundPercentageToTick(position.entryPrice, -stopLossPoints, true);
            
            // Apply gap-aware intrabar logic
            if (this.shouldStopBeHit(position, currentBar, stopLossLevel)) {
                return {
                    shouldExit: true,
                    exitPrice: stopLossLevel,
                    exitReason: `Stop Loss LONG (${stopLossPercent}% = ${stopLossPoints.toFixed(2)} → ${stopLossLevel.toFixed(2)})`
                };
            }
        } else { // SHORT  
            const stopLossPoints = position.entryPrice * stopLossDecimal;
            // For SHORT stop loss, we ADD points and round UP (conservative)
            const stopLossLevel = position.entryPrice + stopLossPoints;
            const roundedStopLoss = Math.ceil(stopLossLevel / RuleHelpers.TICK_SIZE) * RuleHelpers.TICK_SIZE;
            
            // Apply gap-aware intrabar logic
            if (this.shouldStopBeHit(position, currentBar, roundedStopLoss)) {
                return {
                    shouldExit: true,
                    exitPrice: roundedStopLoss,
                    exitReason: `Stop Loss SHORT (${stopLossPercent}% = ${stopLossPoints.toFixed(2)} → ${roundedStopLoss.toFixed(2)})`
                };
            }
        }
        
        return { shouldExit: false };
    }
    
    // Exit Rule: End of Day Exit (IMPLEMENTED)
    evaluateEodExit(position, barIndex, currentBar, data, params) {
        const isEOD = RuleHelpers.isEndOfDay(barIndex, currentBar, data);
        
        if (isEOD) {
            return {
                shouldExit: true,
                exitPrice: currentBar.close,
                exitReason: 'EOD Exit'
            };
        }
        
        return { shouldExit: false };
    }
    
    // Exit Rule: Trailing SL with SPL/SPH (IMPLEMENTED)
    evaluateTrailingSpl(position, barIndex, currentBar, data, params) {
        const pivots = params.pivots || window.pivotData;
        if (!pivots) return { shouldExit: false };
        
        let trailingLevel = null;
        
        if (position.direction === 'LONG') {
            // For LONG: Find SPL that formed AFTER entry and BEFORE current bar
            // Only consider pivots that exist up to the current bar during backtest
            const splAfterEntry = pivots.spl.filter(splBarIndex => 
                splBarIndex > position.entryBar && splBarIndex < barIndex
            );
            
            if (splAfterEntry.length > 0) {
                // Use the MOST RECENT SPL that has formed chronologically
                const mostRecentSplIndex = Math.max(...splAfterEntry);
                trailingLevel = data[mostRecentSplIndex].low;
                
                console.log(`📊 LONG Trailing: Using SPL at bar ${mostRecentSplIndex} (${trailingLevel.toFixed(2)}) formed after entry at bar ${position.entryBar} as trailing stop`);
                
                // Check exit condition
                if (currentBar.low <= trailingLevel) {
                    return {
                        shouldExit: true,
                        exitPrice: trailingLevel,
                        exitReason: `Trailing SPL Exit (${trailingLevel.toFixed(2)})`
                    };
                }
            } else {
                // No SPL formed after entry yet within current timeframe
                console.log(`📊 LONG Trailing: No SPL formed after entry at bar ${position.entryBar} up to current bar ${barIndex}`);
            }
            
        } else { // SHORT
            // For SHORT: Find SPH that formed AFTER entry and BEFORE current bar
            // Only consider pivots that exist up to the current bar during backtest
            const sphAfterEntry = pivots.sph.filter(sphBarIndex => 
                sphBarIndex > position.entryBar && sphBarIndex < barIndex
            );
            
            if (sphAfterEntry.length > 0) {
                // Use the MOST RECENT SPH that has formed chronologically
                const mostRecentSphIndex = Math.max(...sphAfterEntry);
                trailingLevel = data[mostRecentSphIndex].high;
                
                console.log(`📊 SHORT Trailing: Using SPH at bar ${mostRecentSphIndex} (${trailingLevel.toFixed(2)}) formed after entry at bar ${position.entryBar} as trailing stop`);
                
                // Check exit condition
                if (currentBar.high >= trailingLevel) {
                    return {
                        shouldExit: true,
                        exitPrice: trailingLevel,
                        exitReason: `Trailing SPH Exit (${trailingLevel.toFixed(2)})`
                    };
                }
            } else {
                // No SPH formed after entry yet within current timeframe
                console.log(`📊 SHORT Trailing: No SPH formed after entry at bar ${position.entryBar} up to current bar ${barIndex}`);
            }
        }
        
        return { shouldExit: false };
    }
    
    // Exit Rule: Aggressive Profit Trailing (ENHANCED)
    evaluateAggressiveProfit(position, barIndex, currentBar, data, params) {
        const profitThresholdPercent = params.aggressiveProfitPercent || window.ruleConfig.aggressiveProfitPercent;
        const profitPoints = position.entryPrice * (profitThresholdPercent / 100);
        const minProfitLevel = RuleHelpers.roundPercentageToTick(
            position.entryPrice, 
            position.direction === 'LONG' ? profitPoints : -profitPoints,
            position.direction === 'LONG'
        );
        
        // Calculate current unrealized P&L percentage
        const currentPnLPercent = RuleHelpers.getCurrentPnLPercent(position, currentBar);
        
        // Only start trailing if profit exceeds threshold
        if (Math.abs(currentPnLPercent) < profitThresholdPercent) {
            return { shouldExit: false };
        }
        
        // Initialize or get current trailing stop
        if (!position.aggressiveTrailingStop) {
            position.aggressiveTrailingStop = null;
            position.trailingStarted = false;
        }
        
        if (!position.trailingStarted) {
            position.trailingStarted = true;
            console.log(`🎯 Aggressive trailing started for ${position.direction} at ${profitThresholdPercent}% profit`);
        }
        
        // Find best profitable trailing level from previous bars
        let bestTrailingLevel = position.aggressiveTrailingStop;
        
        for (let i = Math.max(0, barIndex - 10); i < barIndex; i++) {
            const checkBar = data[i];
            const rawTrailLevel = position.direction === 'LONG' ? checkBar.low : checkBar.high;
            const trailLevel = RuleHelpers.roundToTick(rawTrailLevel);
            
            // Check if this level gives minimum required profit
            const wouldGiveProfit = position.direction === 'LONG' ? 
                trailLevel >= minProfitLevel : trailLevel <= minProfitLevel;
            
            if (wouldGiveProfit) {
                if (!bestTrailingLevel || 
                    (position.direction === 'LONG' && trailLevel > bestTrailingLevel) ||
                    (position.direction === 'SHORT' && trailLevel < bestTrailingLevel)) {
                    bestTrailingLevel = trailLevel;
                }
            }
        }
        
        // Update trailing stop if we found a better level
        if (bestTrailingLevel !== position.aggressiveTrailingStop) {
            position.aggressiveTrailingStop = bestTrailingLevel;
            const profitAtLevel = ((position.direction === 'LONG' ? bestTrailingLevel - position.entryPrice : position.entryPrice - bestTrailingLevel) / position.entryPrice * 100);
            console.log(`📈 Updated aggressive trailing to ${bestTrailingLevel.toFixed(2)} (${profitAtLevel.toFixed(2)}% profit)`);
        }
        
        // Check for exit condition
        if (position.aggressiveTrailingStop) {
            const shouldExit = position.direction === 'LONG' ? 
                currentBar.low <= position.aggressiveTrailingStop :
                currentBar.high >= position.aggressiveTrailingStop;
                
            if (shouldExit) {
                const finalProfit = ((position.direction === 'LONG' ? position.aggressiveTrailingStop - position.entryPrice : position.entryPrice - position.aggressiveTrailingStop) / position.entryPrice * 100);
                return {
                    shouldExit: true,
                    exitPrice: position.aggressiveTrailingStop,
                    exitReason: `Aggressive Trail ${position.direction} (${finalProfit.toFixed(2)}% profit at ${position.aggressiveTrailingStop.toFixed(2)})`
                };
            }
        }
        
        return { shouldExit: false };
    }
    
    // Exit Rule: Trailing SL with LPL/LPH (NOT IMPLEMENTED)
    evaluateTrailingLpl(position, barIndex, currentBar, data, params) {
        // Placeholder for future implementation
        return { shouldExit: false };
    }
    
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RuleEvaluator = RuleEvaluator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleEvaluator };
}
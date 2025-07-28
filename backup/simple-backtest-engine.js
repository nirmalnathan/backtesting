// simple-backtest-engine.js - FIXED VERSION WITH CORRECTED ENTRY LOGIC AND EOD EXIT
// Minimal backtesting engine for LPH/LPL break entry with configurable rules

// Global backtest state
let backtestState = {
    currentPosition: null, // { direction, entryPrice, entryBar, entryRule, stopLoss, tradedLevel, levelType }
    tradedLevelsToday: [], // [{level: price, type: 'LPH'/'LPL', barIndex: x}] - reset daily
    currentDay: null,
    trades: [], // Completed trades
    niftyValue: 25000, // For 0.3% calculation
    isRunning: false
};

// Main backtesting function
function runSimpleBacktest() {
    console.log('=== STARTING FIXED SIMPLE BACKTEST ===');
    console.log('Active rule configuration:', window.ruleConfig);
    
    // Validate rule configuration
    if (!window.ruleConfig || !validateRuleConfiguration()) {
        alert('Invalid rule configuration. Please check your settings.');
        return;
    }
    
    // Validate data
    if (!window.chartData || !window.pivotData) {
        alert('Please form bars and detect pivots first!');
        return;
    }
    
    if (window.chartData.length < 10) {
        alert('Need at least 10 bars for backtesting');
        return;
    }
    
    // Check for potential infinite position warning
    checkForInfinitePositionRisk();
    
    // Reset state COMPLETELY
    backtestState = {
        currentPosition: null,
        tradedLevelsToday: [],
        currentDay: null,
        trades: [],
        niftyValue: 25000,
        isRunning: true
    };
    
    const data = window.chartData;
    const pivots = window.pivotData;
    
    console.log(`Processing ${data.length} bars with rule configuration:`);
    console.log(`- Entry LPH/LPL: ${window.ruleConfig.entryLphLpl}`);
    console.log(`- Gap Handling: ${window.ruleConfig.gapHandling}`);
    console.log(`- Stop Loss: ${window.ruleConfig.stopLoss} (${window.ruleConfig.stopLossPercent}%)`);
    console.log(`- EOD Exit: ${window.ruleConfig.eodExit}`);
    console.log(`- Daily Reset: ${window.ruleConfig.dailyReset}`);
    
    console.log(`Available pivots: SPH(${pivots.sph.length}), SPL(${pivots.spl.length}), LPH(${pivots.lph.length}), LPL(${pivots.lpl.length})`);
    
    // Log LPH and LPL details for debugging
    if (pivots.lph.length > 0) {
        console.log('LPH pivots:', pivots.lph.map(idx => `Bar ${idx}: High=${data[idx].high.toFixed(2)}`));
    }
    if (pivots.lpl.length > 0) {
        console.log('LPL pivots:', pivots.lpl.map(idx => `Bar ${idx}: Low=${data[idx].low.toFixed(2)}`));
    }
    
    // Process each bar
    for (let barIndex = 0; barIndex < data.length; barIndex++) {
        const currentBar = data[barIndex];
        const currentDate = new Date(currentBar.datetime).toDateString();
        
        // Check for new day
        if (backtestState.currentDay !== currentDate) {
            handleNewDay(currentDate, barIndex, currentBar);
        }
        
        // Process exits first (if in position)
        if (backtestState.currentPosition) {
            processExits(barIndex, currentBar);
        }
        
        // Process entries (if not in position)
        if (!backtestState.currentPosition) {
            processEntries(barIndex, currentBar, pivots);
        }
    }
    
    // Final exit if still in position (ONLY if EOD exit rule is enabled)
    if (backtestState.currentPosition && window.ruleConfig.eodExit) {
        const lastBar = data[data.length - 1];
        exitPosition(data.length - 1, lastBar, lastBar.close, 'EOD Exit - Final');
    } else if (backtestState.currentPosition) {
        console.log('💡 Position still open at end of data - EOD exit disabled');
    }
    
    backtestState.isRunning = false;
    
    console.log('=== BACKTEST COMPLETED ===');
    console.log(`Total trades: ${backtestState.trades.length}`);
    
    // Display results
    displayResults();
}

// Check for potential infinite position risk
function checkForInfinitePositionRisk() {
    const hasStopLoss = window.ruleConfig.stopLoss;
    const hasEodExit = window.ruleConfig.eodExit;
    
    if (!hasStopLoss && !hasEodExit) {
        const proceed = confirm(
            'WARNING: Both Stop Loss and EOD Exit are disabled!\n\n' +
            'This could result in positions running indefinitely without any exit conditions.\n\n' +
            'Do you want to continue anyway?'
        );
        
        if (!proceed) {
            throw new Error('Backtest cancelled - No exit rules enabled');
        }
    }
}

// Validate rule configuration
function validateRuleConfiguration() {
    if (!window.ruleConfig) {
        console.error('No rule configuration found');
        return false;
    }
    
    // Check entry rules
    if (!window.ruleConfig.entryLphLpl) {
        console.error('No entry rules enabled');
        return false;
    }
    
    // Check exit rules - at least one should be enabled OR user should be warned
    const hasValidStopLoss = window.ruleConfig.stopLoss && 
                           window.ruleConfig.stopLossPercent >= 0.1 && 
                           window.ruleConfig.stopLossPercent <= 5.0;
    const hasValidEodExit = window.ruleConfig.eodExit;
    
    // Allow no exit rules but this will be handled by the warning above
    return true;
}

// Handle new trading day - FIXED TO RESPECT EOD EXIT SETTING
function handleNewDay(newDate, barIndex, currentBar) {
    console.log(`\n=== NEW DAY: ${newDate} (Bar ${barIndex}) ===`);
    console.log(`Previous day: ${backtestState.currentDay}`);
    console.log(`Current bar: Open=${currentBar.open?.toFixed(2)}, High=${currentBar.high?.toFixed(2)}, Low=${currentBar.low?.toFixed(2)}, Close=${currentBar.close?.toFixed(2)}`);
    
    // FIXED: Only force EOD exit if EOD exit rule is enabled
    if (backtestState.currentPosition && window.ruleConfig.eodExit) {
        console.log('Force EOD exit from previous day (EOD exit rule enabled)');
        exitPosition(barIndex, currentBar, currentBar.open, 'EOD Exit - Previous Day');
    } else if (backtestState.currentPosition) {
        console.log('💡 Carrying position to new day (EOD exit rule disabled)');
    }
    
    // Reset daily state
    backtestState.currentDay = newDate;
    
    // Reset traded levels only if daily reset enabled
    if (window.ruleConfig.dailyReset) {
        const previousTradedLevels = [...backtestState.tradedLevelsToday];
        backtestState.tradedLevelsToday = [];
        console.log(`Previous day traded levels:`, previousTradedLevels);
        console.log('Reset traded levels for new day (Daily reset enabled)');
    } else {
        console.log('💡 Keeping traded levels from previous days (Daily reset disabled)');
    }
}

// Process exit conditions - FIXED EOD EXIT LOGIC
function processExits(barIndex, currentBar) {
    const position = backtestState.currentPosition;
    
    // Check stop loss (only if stop loss rule enabled)
    if (window.ruleConfig.stopLoss) {
        const stopLossPercent = window.ruleConfig.stopLossPercent / 100; // Convert to decimal
        
        if (position.direction === 'LONG') {
            // For long positions: exit if price goes below stop loss
            const stopLossLevel = position.entryPrice - (position.entryPrice * stopLossPercent);
            if (currentBar.low <= stopLossLevel) {
                const exitPrice = stopLossLevel; // Exit exactly at stop loss level
                exitPosition(barIndex, currentBar, exitPrice, `Stop Loss LONG (${window.ruleConfig.stopLossPercent}% = ${(position.entryPrice * stopLossPercent).toFixed(2)} points)`);
                return;
            }
        } else { // SHORT
            // For short positions: exit if price goes above stop loss
            const stopLossLevel = position.entryPrice + (position.entryPrice * stopLossPercent);
            if (currentBar.high >= stopLossLevel) {
                const exitPrice = stopLossLevel; // Exit exactly at stop loss level
                exitPosition(barIndex, currentBar, exitPrice, `Stop Loss SHORT (${window.ruleConfig.stopLossPercent}% = ${(position.entryPrice * stopLossPercent).toFixed(2)} points)`);
                return;
            }
        }
    }
    
    // FIXED: Check EOD exit only if EOD exit rule is enabled
    if (window.ruleConfig.eodExit) {
        const isEOD = isEndOfDay(barIndex, currentBar);
        if (isEOD) {
            exitPosition(barIndex, currentBar, currentBar.close, 'EOD Exit');
            return;
        }
    }
    
    // If no exit conditions met and no exit rules enabled, position continues
}

// Process entry conditions - FIXED ENTRY LOGIC FOR SAME BAR DETECTION
function processEntries(barIndex, currentBar, pivots) {
    // Only process entries if entry rule is enabled
    if (!window.ruleConfig.entryLphLpl) {
        return;
    }
    
    // Get most recent LPH and LPL
    const recentLPH = getMostRecentPivot(pivots.lph, barIndex);
    const recentLPL = getMostRecentPivot(pivots.lpl, barIndex);
    
    if (!recentLPH && !recentLPL) {
        return; // No pivots available yet
    }
    
    console.log(`\n--- Bar ${barIndex} Entry Check ---`);
    console.log(`Current Bar: Open=${currentBar.open?.toFixed(2)}, High=${currentBar.high?.toFixed(2)}, Low=${currentBar.low?.toFixed(2)}, Close=${currentBar.close?.toFixed(2)}`);
    
    // FIXED: Check LPH break for LONG entry (price breaks ABOVE LPH HIGH) - SAME BAR LOGIC
    if (recentLPH) {
        const lphHigh = window.chartData[recentLPH.barIndex].high;
        console.log(`LPH Check: Recent LPH at Bar ${recentLPH.barIndex}, High=${lphHigh.toFixed(2)}`);
        
        // Check if already traded this level (based on daily reset setting)
        let alreadyTradedLPH = false;
        if (window.ruleConfig.dailyReset) {
            alreadyTradedLPH = backtestState.tradedLevelsToday.some(traded => 
                Math.abs(traded.level - lphHigh) < 0.1 && traded.type === 'LPH'
            );
        } else {
            // If daily reset disabled, check against all historical trades to avoid re-trading
            alreadyTradedLPH = backtestState.trades.some(trade => 
                trade.entryRule.includes('LPH') && Math.abs(parseFloat(trade.entryRule.match(/LPH=([0-9.]+)/)?.[1] || 0) - lphHigh) < 0.1
            );
        }
        
        console.log(`LPH Already Traded: ${alreadyTradedLPH} (Daily Reset: ${window.ruleConfig.dailyReset})`);
        console.log(`LPH Break Check: Current High (${currentBar.high?.toFixed(2)}) > LPH High (${lphHigh.toFixed(2)}) = ${currentBar.high > lphHigh}`);
        
        // FIXED: Check break on CURRENT bar, enter on CURRENT bar
        if (!alreadyTradedLPH && currentBar.high > lphHigh) {
            let entryPrice;
            let entryType;
            
            // FIXED: Gap detection logic - check if SAME bar opened above LPH
            if (window.ruleConfig.gapHandling && currentBar.open > lphHigh) {
                // Gap up scenario - market opened above LPH on current bar
                entryPrice = currentBar.open;
                entryType = `LONG LPH GAP entry (LPH=${lphHigh.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                console.log(`🔥 GAP UP DETECTED: Bar ${barIndex} opened at ${currentBar.open.toFixed(2)} above LPH ${lphHigh.toFixed(2)}`);
            } else {
                // Normal breakout scenario - price broke above LPH during current bar
                entryPrice = lphHigh + 0.5;
                entryType = `LONG LPH breakout entry (${lphHigh.toFixed(2)})`;
                console.log(`📈 NORMAL BREAKOUT: Bar ${barIndex} broke above LPH ${lphHigh.toFixed(2)}, entry at ${entryPrice.toFixed(2)}`);
            }
            
            enterPosition(barIndex, currentBar, entryPrice, lphHigh, 'LPH', 'LONG', entryType);
            return; // Exit after entry to avoid multiple entries in same bar
        }
    }
    
    // FIXED: Check LPL break for SHORT entry (price breaks BELOW LPL LOW) - SAME BAR LOGIC
    if (recentLPL) {
        const lplLow = window.chartData[recentLPL.barIndex].low;
        console.log(`LPL Check: Recent LPL at Bar ${recentLPL.barIndex}, Low=${lplLow.toFixed(2)}`);
        
        // Check if already traded this level (based on daily reset setting)
        let alreadyTradedLPL = false;
        if (window.ruleConfig.dailyReset) {
            alreadyTradedLPL = backtestState.tradedLevelsToday.some(traded => 
                Math.abs(traded.level - lplLow) < 0.1 && traded.type === 'LPL'
            );
        } else {
            // If daily reset disabled, check against all historical trades to avoid re-trading
            alreadyTradedLPL = backtestState.trades.some(trade => 
                trade.entryRule.includes('LPL') && Math.abs(parseFloat(trade.entryRule.match(/LPL=([0-9.]+)/)?.[1] || 0) - lplLow) < 0.1
            );
        }
        
        console.log(`LPL Already Traded: ${alreadyTradedLPL} (Daily Reset: ${window.ruleConfig.dailyReset})`);
        console.log(`LPL Break Check: Current Low (${currentBar.low?.toFixed(2)}) < LPL Low (${lplLow.toFixed(2)}) = ${currentBar.low < lplLow}`);
        
        // FIXED: Check break on CURRENT bar, enter on CURRENT bar
        if (!alreadyTradedLPL && currentBar.low < lplLow) {
            let entryPrice;
            let entryType;
            
            // FIXED: Gap detection logic - check if SAME bar opened below LPL
            if (window.ruleConfig.gapHandling && currentBar.open < lplLow) {
                // Gap down scenario - market opened below LPL on current bar
                entryPrice = currentBar.open;
                entryType = `SHORT LPL GAP entry (LPL=${lplLow.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                console.log(`🔥 GAP DOWN DETECTED: Bar ${barIndex} opened at ${currentBar.open.toFixed(2)} below LPL ${lplLow.toFixed(2)}`);
            } else {
                // Normal breakdown scenario - price broke below LPL during current bar
                entryPrice = lplLow - 0.5;
                entryType = `SHORT LPL breakdown entry (${lplLow.toFixed(2)})`;
                console.log(`📉 NORMAL BREAKDOWN: Bar ${barIndex} broke below LPL ${lplLow.toFixed(2)}, entry at ${entryPrice.toFixed(2)}`);
            }
            
            enterPosition(barIndex, currentBar, entryPrice, lplLow, 'LPL', 'SHORT', entryType);
            return; // Exit after entry to avoid multiple entries in same bar
        }
    }
    
    console.log(`--- End Bar ${barIndex} Entry Check (No Entry) ---`);
}

// Enter a new position - ENHANCED FOR CONFIGURABLE STOP LOSS
function enterPosition(barIndex, currentBar, entryPrice, tradedLevel, levelType, direction, entryType) {
    let stopLossLevel = null;
    
    // Calculate stop loss only if stop loss rule is enabled
    if (window.ruleConfig.stopLoss) {
        const stopLossPercent = window.ruleConfig.stopLossPercent / 100; // Convert to decimal
        
        if (direction === 'LONG') {
            stopLossLevel = entryPrice - (entryPrice * stopLossPercent); // X% below entry for long
        } else { // SHORT
            stopLossLevel = entryPrice + (entryPrice * stopLossPercent); // X% above entry for short
        }
    }
    
    // Use provided entryType or create default
    const ruleDescription = entryType || `${direction} on ${levelType} break (${tradedLevel.toFixed(2)})`;
    
    backtestState.currentPosition = {
        direction: direction,
        entryPrice: entryPrice,
        entryBar: barIndex,
        entryRule: ruleDescription,
        stopLoss: stopLossLevel,
        tradedLevel: tradedLevel,
        levelType: levelType,
        entryTime: currentBar.datetime
    };
    
    // Mark this level as traded (based on daily reset setting)
    if (window.ruleConfig.dailyReset) {
        // Only track for current day if daily reset enabled
        backtestState.tradedLevelsToday.push({
            level: tradedLevel,
            type: levelType,
            barIndex: barIndex
        });
    }
    // If daily reset disabled, we rely on historical trade checking instead
    
    const stopLossText = stopLossLevel ? 
        `Stop Loss: ${stopLossLevel.toFixed(2)} (${window.ruleConfig.stopLossPercent}% = ${(entryPrice * (window.ruleConfig.stopLossPercent / 100)).toFixed(2)} points)` : 
        'Stop Loss: Disabled';
    
    console.log(`\n✅ ENTRY: Bar ${barIndex} | ${direction} at ${entryPrice.toFixed(2)} | Rule: ${ruleDescription} | ${stopLossText}`);
}

// Exit current position
function exitPosition(barIndex, currentBar, exitPrice, exitReason) {
    const position = backtestState.currentPosition;
    let points;
    
    // Calculate P&L based on position direction
    if (position.direction === 'LONG') {
        points = exitPrice - position.entryPrice; // Long: profit when exit > entry
    } else { // SHORT
        points = position.entryPrice - exitPrice; // Short: profit when entry > exit
    }
    
    const duration = barIndex - position.entryBar;
    
    const trade = {
        tradeId: backtestState.trades.length + 1,
        direction: position.direction,
        entryBar: position.entryBar,
        exitBar: barIndex,
        entryPrice: position.entryPrice,
        exitPrice: exitPrice,
        points: points,
        duration: duration,
        entryRule: position.entryRule,
        exitRule: exitReason,
        entryTime: position.entryTime,
        exitTime: currentBar.datetime,
        isWin: points > 0
    };
    
    backtestState.trades.push(trade);
    backtestState.currentPosition = null;
    
    console.log(`❌ EXIT: Bar ${barIndex} | ${position.direction} at ${exitPrice.toFixed(2)} | Points: ${points.toFixed(2)} | Reason: ${exitReason}`);
}

// Get most recent pivot that occurred before current bar - ENHANCED DEBUG
function getMostRecentPivot(pivotArray, currentBarIndex) {
    if (!pivotArray || pivotArray.length === 0) return null;
    
    // Find the most recent pivot that occurred before current bar
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

// Check if current bar is end of day
function isEndOfDay(barIndex, currentBar) {
    const data = window.chartData;
    
    // Check if this is the last bar of the dataset
    if (barIndex === data.length - 1) {
        return true;
    }
    
    // Check if next bar is a different day
    const currentDate = new Date(currentBar.datetime).toDateString();
    const nextDate = new Date(data[barIndex + 1].datetime).toDateString();
    
    return currentDate !== nextDate;
}

// Display backtest results
function displayResults() {
    if (typeof displaySimpleResults === 'function') {
        displaySimpleResults(backtestState.trades);
    } else {
        console.log('Results display function not available');
        console.log('Trades:', backtestState.trades);
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.runSimpleBacktest = runSimpleBacktest;
    window.backtestState = backtestState;
    
    console.log('Fixed simple backtest engine loaded successfully');
    console.log('runSimpleBacktest function available:', typeof window.runSimpleBacktest);
}
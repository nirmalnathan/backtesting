// simple-backtest-engine.js - COMPLETE FIXED VERSION WITH GAP HANDLING
// Minimal backtesting engine for LPH/LPL break entry with stop loss and EOD exit

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
    console.log('=== STARTING SIMPLE BACKTEST ===');
    
    // Validate data
    if (!window.chartData || !window.pivotData) {
        alert('Please form bars and detect pivots first!');
        return;
    }
    
    if (window.chartData.length < 10) {
        alert('Need at least 10 bars for backtesting');
        return;
    }
    
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
    
    console.log(`Processing ${data.length} bars`);
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
    
    // Final EOD exit if still in position
    if (backtestState.currentPosition) {
        const lastBar = data[data.length - 1];
        exitPosition(data.length - 1, lastBar, lastBar.close, 'EOD Exit - Final');
    }
    
    backtestState.isRunning = false;
    
    console.log('=== BACKTEST COMPLETED ===');
    console.log(`Total trades: ${backtestState.trades.length}`);
    
    // Display results
    displayResults();
}

// Handle new trading day - ENHANCED DEBUG
function handleNewDay(newDate, barIndex, currentBar) {
    console.log(`\n=== NEW DAY: ${newDate} (Bar ${barIndex}) ===`);
    console.log(`Previous day: ${backtestState.currentDay}`);
    console.log(`Current bar: Open=${currentBar.open?.toFixed(2)}, High=${currentBar.high?.toFixed(2)}, Low=${currentBar.low?.toFixed(2)}, Close=${currentBar.close?.toFixed(2)}`);
    
    // Force EOD exit if still in position from previous day
    if (backtestState.currentPosition) {
        console.log('Force EOD exit from previous day');
        exitPosition(barIndex, currentBar, currentBar.open, 'EOD Exit - Previous Day');
    }
    
    // Reset daily state
    backtestState.currentDay = newDate;
    const previousTradedLevels = [...backtestState.tradedLevelsToday];
    backtestState.tradedLevelsToday = [];
    
    console.log(`Previous day traded levels:`, previousTradedLevels);
    console.log('Reset traded levels for new day - array is now empty');
}

// Process exit conditions
function processExits(barIndex, currentBar) {
    const position = backtestState.currentPosition;
    
    // Check stop loss based on position direction
    if (position.direction === 'LONG') {
        // For long positions: exit if price goes below stop loss
        const stopLossLevel = position.entryPrice - (position.entryPrice * 0.003);
        if (currentBar.low <= stopLossLevel) {
            const exitPrice = stopLossLevel; // Exit exactly at stop loss level
            exitPosition(barIndex, currentBar, exitPrice, `Stop Loss LONG (0.3% = ${(position.entryPrice * 0.003).toFixed(2)} points)`);
            return;
        }
    } else { // SHORT
        // For short positions: exit if price goes above stop loss
        const stopLossLevel = position.entryPrice + (position.entryPrice * 0.003);
        if (currentBar.high >= stopLossLevel) {
            const exitPrice = stopLossLevel; // Exit exactly at stop loss level
            exitPosition(barIndex, currentBar, exitPrice, `Stop Loss SHORT (0.3% = ${(position.entryPrice * 0.003).toFixed(2)} points)`);
            return;
        }
    }
    
    // Check EOD exit (last bar of day or explicit EOD time)
    const isEOD = isEndOfDay(barIndex, currentBar);
    if (isEOD) {
        exitPosition(barIndex, currentBar, currentBar.close, 'EOD Exit');
        return;
    }
}

// Process entry conditions - COMPLETE GAP HANDLING FIX
function processEntries(barIndex, currentBar, pivots) {
    // Get most recent LPH and LPL
    const recentLPH = getMostRecentPivot(pivots.lph, barIndex);
    const recentLPL = getMostRecentPivot(pivots.lpl, barIndex);
    
    if (!recentLPH && !recentLPL) {
        return; // No pivots available yet
    }
    
    console.log(`\n--- Bar ${barIndex} Entry Check ---`);
    console.log(`Current Bar: Open=${currentBar.open?.toFixed(2)}, High=${currentBar.high?.toFixed(2)}, Low=${currentBar.low?.toFixed(2)}, Close=${currentBar.close?.toFixed(2)}`);
    
    // Check LPH break for LONG entry (price breaks ABOVE LPH HIGH)
    if (recentLPH) {
        const lphHigh = window.chartData[recentLPH.barIndex].high;
        console.log(`LPH Check: Recent LPH at Bar ${recentLPH.barIndex}, High=${lphHigh.toFixed(2)}`);
        
        const alreadyTradedLPH = backtestState.tradedLevelsToday.some(traded => 
            Math.abs(traded.level - lphHigh) < 0.1 && traded.type === 'LPH'
        );
        
        console.log(`LPH Already Traded Today: ${alreadyTradedLPH}`);
        console.log(`LPH Break Check: Current High (${currentBar.high?.toFixed(2)}) > LPH High (${lphHigh.toFixed(2)}) = ${currentBar.high > lphHigh}`);
        
        if (!alreadyTradedLPH && currentBar.high > lphHigh) {
            let entryPrice;
            let entryType;
            
            console.log(`🔍 LPH Gap Check: Current Open (${currentBar.open?.toFixed(2)}) > LPH High (${lphHigh.toFixed(2)}) = ${currentBar.open > lphHigh}`);
            
            if (currentBar.open > lphHigh) {
                // Gap up scenario - market opened above LPH
                entryPrice = currentBar.open;
                entryType = `LONG LPH GAP entry (LPH=${lphHigh.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                console.log(`🔥 GAP UP DETECTED: Market opened at ${currentBar.open.toFixed(2)} above LPH ${lphHigh.toFixed(2)}`);
            } else {
                // Normal breakout scenario - price broke above LPH during the bar
                entryPrice = lphHigh + 0.5;
                entryType = `LONG LPH breakout entry (${lphHigh.toFixed(2)})`;
                console.log(`📈 NORMAL BREAKOUT: Price broke above LPH ${lphHigh.toFixed(2)} during bar, entry at ${entryPrice.toFixed(2)}`);
            }
            
            enterPosition(barIndex, currentBar, entryPrice, lphHigh, 'LPH', 'LONG', entryType);
            return; // Exit after entry to avoid multiple entries in same bar
        }
    }
    
    // Check LPL break for SHORT entry (price breaks BELOW LPL LOW)
    if (recentLPL) {
        const lplLow = window.chartData[recentLPL.barIndex].low;
        console.log(`LPL Check: Recent LPL at Bar ${recentLPL.barIndex}, Low=${lplLow.toFixed(2)}`);
        
        const alreadyTradedLPL = backtestState.tradedLevelsToday.some(traded => 
            Math.abs(traded.level - lplLow) < 0.1 && traded.type === 'LPL'
        );
        
        console.log(`LPL Already Traded Today: ${alreadyTradedLPL}`);
        console.log(`LPL Break Check: Current Low (${currentBar.low?.toFixed(2)}) < LPL Low (${lplLow.toFixed(2)}) = ${currentBar.low < lplLow}`);
        
        if (!alreadyTradedLPL && currentBar.low < lplLow) {
            let entryPrice;
            let entryType;
            
            console.log(`🔍 LPL Gap Check: Current Open (${currentBar.open?.toFixed(2)}) < LPL Low (${lplLow.toFixed(2)}) = ${currentBar.open < lplLow}`);
            
            if (currentBar.open < lplLow) {
                // Gap down scenario - market opened below LPL
                entryPrice = currentBar.open;
                entryType = `SHORT LPL GAP entry (LPL=${lplLow.toFixed(2)}, opened at ${currentBar.open.toFixed(2)})`;
                console.log(`🔥 GAP DOWN DETECTED: Market opened at ${currentBar.open.toFixed(2)} below LPL ${lplLow.toFixed(2)}`);
            } else {
                // Normal breakdown scenario - price broke below LPL during the bar
                entryPrice = lplLow - 0.5;
                entryType = `SHORT LPL breakdown entry (${lplLow.toFixed(2)})`;
                console.log(`📉 NORMAL BREAKDOWN: Price broke below LPL ${lplLow.toFixed(2)} during bar, entry at ${entryPrice.toFixed(2)}`);
            }
            
            enterPosition(barIndex, currentBar, entryPrice, lplLow, 'LPL', 'SHORT', entryType);
            return; // Exit after entry to avoid multiple entries in same bar
        }
    }
    
    console.log(`--- End Bar ${barIndex} Entry Check (No Entry) ---`);
}

// Enter a new position - UPDATED FOR GAP HANDLING
function enterPosition(barIndex, currentBar, entryPrice, tradedLevel, levelType, direction, entryType) {
    let stopLossLevel;
    
    if (direction === 'LONG') {
        stopLossLevel = entryPrice - (entryPrice * 0.003); // 0.3% below entry for long
    } else { // SHORT
        stopLossLevel = entryPrice + (entryPrice * 0.003); // 0.3% above entry for short
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
    
    // Mark this level as traded today
    backtestState.tradedLevelsToday.push({
        level: tradedLevel,
        type: levelType,
        barIndex: barIndex
    });
    
    console.log(`\n✅ ENTRY: Bar ${barIndex} | ${direction} at ${entryPrice.toFixed(2)} | Rule: ${ruleDescription} | Stop Loss: ${stopLossLevel.toFixed(2)} (0.3% = ${(entryPrice * 0.003).toFixed(2)} points)`);
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
    
    console.log(`Looking for most recent pivot before bar ${currentBarIndex} in array:`, pivotArray);
    
    for (let i = 0; i < pivotArray.length; i++) {
        const pivotBarIndex = pivotArray[i];
        console.log(`  Checking pivot ${i}: Bar ${pivotBarIndex} (before current bar ${currentBarIndex}? ${pivotBarIndex < currentBarIndex})`);
        
        if (pivotBarIndex < currentBarIndex && pivotBarIndex > mostRecentIndex) {
            mostRecentIndex = pivotBarIndex;
            mostRecentPivot = {
                barIndex: pivotBarIndex,
                pivotIndex: i
            };
            console.log(`    ✓ New most recent: Bar ${pivotBarIndex}`);
        }
    }
    
    if (mostRecentPivot) {
        const pivotBar = window.chartData[mostRecentPivot.barIndex];
        console.log(`Final most recent pivot: Bar ${mostRecentPivot.barIndex}, OHLC: O=${pivotBar.open?.toFixed(2)} H=${pivotBar.high?.toFixed(2)} L=${pivotBar.low?.toFixed(2)} C=${pivotBar.close?.toFixed(2)}`);
    } else {
        console.log(`No recent pivot found before bar ${currentBarIndex}`);
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
    
    console.log('Simple backtest engine loaded successfully');
    console.log('runSimpleBacktest function available:', typeof window.runSimpleBacktest);
}
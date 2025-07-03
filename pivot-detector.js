// pivot-detector-fixed.js
// FIXED: Test each anchor against ALL remaining bars before moving to next anchor

function detectPivots(data) {
if (!data || !Array.isArray(data) || data.length < 3) {
        console.warn('Invalid data provided to detectPivots:', data);
        return { sph: [], spl: [], lph: [], lpl: [] };
    }
    
    console.log(`=== STARTING METHODICAL PIVOT DETECTION ON ${data.length} BARS ===`);
    
    const confirmedPivots = [];
    let currentSearchIndex = 0;
    let lastPivotType = null; // Track last confirmed pivot type for alternation
    
    // Phase 1: Systematic bar-by-bar detection with proper alternation
    while (currentSearchIndex < data.length - 2) {
        console.log(`\n--- Testing from search index ${currentSearchIndex} ---`);
        console.log(`Last pivot type: ${lastPivotType || 'NONE'}`);
        
        let patternFound = false;
        let nextSearchIndex = currentSearchIndex + 1; // Default increment
        
        // FIXED: Test each bar starting from currentSearchIndex as potential Anchor
        for (let anchorIdx = currentSearchIndex; anchorIdx < data.length - 2; anchorIdx++) {
            console.log(`\nTesting Bar ${anchorIdx} as Anchor:`);
            const anchor = data[anchorIdx];
            console.log(`  Anchor ${anchorIdx}: Open=${anchor.open.toFixed(2)}, High=${anchor.high.toFixed(2)}, Low=${anchor.low.toFixed(2)}, Close=${anchor.close.toFixed(2)}`);
            
            let anchorFoundPattern = false; // Track if THIS anchor found a pattern
            
            // Look for SPH pattern (only if we need SPH for alternation OR no previous pivot)
            if (lastPivotType !== 'sph') {
                console.log(`  Looking for SPH pattern (alternation allows SPH)...`);
                let sphB1 = -1, sphB2 = -1;
                
                // FIXED: Find B1 for SPH: test against ALL remaining bars
                for (let i = anchorIdx + 1; i < data.length; i++) {
                    const bar = data[i];
                    console.log(`    Checking Bar ${i}: low=${bar.low.toFixed(2)} vs anchor.low=${anchor.low.toFixed(2)}, close=${bar.close.toFixed(2)} vs anchor.close=${anchor.close.toFixed(2)}`);
                    
                    if (bar.low < anchor.low && bar.close < anchor.close) {
                        sphB1 = i;
                        console.log(`    ✓ Found SPH B1 at Bar ${i}`);
                        break;
                    } else {
                        console.log(`    ✗ Bar ${i} doesn't qualify for SPH B1`);
                    }
                }
                
                // FIXED: Find B2 for SPH: test against ALL remaining bars after B1
                if (sphB1 !== -1) {
                    console.log(`  Looking for SPH B2 after B1=${sphB1}...`);
                    for (let i = sphB1 + 1; i < data.length; i++) {
                        const bar = data[i];
                        console.log(`    Checking Bar ${i}: low=${bar.low.toFixed(2)} vs anchor.low=${anchor.low.toFixed(2)}, close=${bar.close.toFixed(2)} vs anchor.close=${anchor.close.toFixed(2)}`);
                        
                        if (bar.low < anchor.low && bar.close < anchor.close) {
                            sphB2 = i;
                            console.log(`    ✓ Found SPH B2 at Bar ${i}`);
                            break;
                        } else {
                            console.log(`    ✗ Bar ${i} doesn't qualify for SPH B2`);
                        }
                    }
                }
                
                // Check if SPH pattern is complete
                if (sphB1 !== -1 && sphB2 !== -1) {
                    const candidates = [
                        { idx: anchorIdx, price: anchor.high, label: 'Anchor' },
                        { idx: sphB1, price: data[sphB1].high, label: 'B1' },
                        { idx: sphB2, price: data[sphB2].high, label: 'B2' }
                    ];
                    
                    console.log(`  SPH Pattern Complete! Candidates:`);
                    candidates.forEach(c => console.log(`    ${c.label} Bar ${c.idx}: high=${c.price.toFixed(2)}`));
                    
                    const sphBar = candidates.reduce((max, bar) => bar.price > max.price ? bar : max);
                    console.log(`  ✓ SPH CONFIRMED: Bar ${sphBar.idx} with high=${sphBar.price.toFixed(2)}`);
                    
                    confirmedPivots.push({
                        type: 'sph',
                        pivotIdx: sphBar.idx,
                        price: sphBar.price,
                        anchor: anchorIdx,
                        b1: sphB1,
                        b2: sphB2
                    });
                    
                    lastPivotType = 'sph';
                    nextSearchIndex = sphB2;
                    patternFound = true;
                    anchorFoundPattern = true; // This anchor found a pattern
                    console.log(`  Next search will start from Bar ${nextSearchIndex} (B2 position)`);
                    console.log(`  Last pivot type updated to: ${lastPivotType}`);
                } else {
                    console.log(`  SPH pattern incomplete: B1=${sphB1}, B2=${sphB2}`);
                }
            } else {
                console.log(`  Skipping SPH pattern (alternation requires SPL next)`);
            }
            
            // Only look for SPL if SPH wasn't found with this anchor
            if (!anchorFoundPattern && lastPivotType !== 'spl') {
                console.log(`  Looking for SPL pattern (alternation allows SPL)...`);
                let splB1 = -1, splB2 = -1;
                
                // FIXED: Find B1 for SPL: test against ALL remaining bars
                for (let i = anchorIdx + 1; i < data.length; i++) {
                    const bar = data[i];
                    console.log(`    Checking Bar ${i}: high=${bar.high.toFixed(2)} vs anchor.high=${anchor.high.toFixed(2)}, close=${bar.close.toFixed(2)} vs anchor.close=${anchor.close.toFixed(2)}`);
                    
                    if (bar.high > anchor.high && bar.close > anchor.close) {
                        splB1 = i;
                        console.log(`    ✓ Found SPL B1 at Bar ${i}`);
                        break;
                    } else {
                        console.log(`    ✗ Bar ${i} doesn't qualify for SPL B1`);
                    }
                }
                
                // FIXED: Find B2 for SPL: test against ALL remaining bars after B1
                if (splB1 !== -1) {
                    console.log(`  Looking for SPL B2 after B1=${splB1}...`);
                    for (let i = splB1 + 1; i < data.length; i++) {
                        const bar = data[i];
                        console.log(`    Checking Bar ${i}: high=${bar.high.toFixed(2)} vs anchor.high=${anchor.high.toFixed(2)}, close=${bar.close.toFixed(2)} vs anchor.close=${anchor.close.toFixed(2)}`);
                        
                        if (bar.high > anchor.high && bar.close > anchor.close) {
                            splB2 = i;
                            console.log(`    ✓ Found SPL B2 at Bar ${i}`);
                            break;
                        } else {
                            console.log(`    ✗ Bar ${i} doesn't qualify for SPL B2`);
                        }
                    }
                }
                
                // Check if SPL pattern is complete
                if (splB1 !== -1 && splB2 !== -1) {
                    const candidates = [
                        { idx: anchorIdx, price: anchor.low, label: 'Anchor' },
                        { idx: splB1, price: data[splB1].low, label: 'B1' },
                        { idx: splB2, price: data[splB2].low, label: 'B2' }
                    ];
                    
                    console.log(`  SPL Pattern Complete! Candidates:`);
                    candidates.forEach(c => console.log(`    ${c.label} Bar ${c.idx}: low=${c.price.toFixed(2)}`));
                    
                    const splBar = candidates.reduce((min, bar) => bar.price < min.price ? bar : min);
                    console.log(`  ✓ SPL CONFIRMED: Bar ${splBar.idx} with low=${splBar.price.toFixed(2)}`);
                    
                    confirmedPivots.push({
                        type: 'spl',
                        pivotIdx: splBar.idx,
                        price: splBar.price,
                        anchor: anchorIdx,
                        b1: splB1,
                        b2: splB2
                    });
                    
                    lastPivotType = 'spl';
                    nextSearchIndex = splB2;
                    patternFound = true;
                    anchorFoundPattern = true; // This anchor found a pattern
                    console.log(`  Next search will start from Bar ${nextSearchIndex} (B2 position)`);
                    console.log(`  Last pivot type updated to: ${lastPivotType}`);
                } else {
                    console.log(`  SPL pattern incomplete: B1=${splB1}, B2=${splB2}`);
                }
            } else if (!anchorFoundPattern) {
                console.log(`  Skipping SPL pattern (alternation requires SPH next)`);
            }
            
            // FIXED: If this anchor found a pattern, break out of for loop
            if (anchorFoundPattern) {
                break; // Exit for loop, continue with while loop
            }
            
            // FIXED: Only move to next anchor after testing against ALL remaining bars
            console.log(`  Bar ${anchorIdx} tested against all remaining bars - no valid pattern found, trying Bar ${anchorIdx + 1} as anchor`);
        }
        
        // FIXED: Set currentSearchIndex based on what happened in the for loop
        if (patternFound) {
            currentSearchIndex = nextSearchIndex; // Jump to B2 of found pattern
        } else {
            // FIXED: If no pattern found anywhere, we've reached the end
            console.log(`No more alternating patterns can be found from Bar ${currentSearchIndex} onwards.`);
            break; // Exit while loop completely
        }
    }
    
    console.log(`\n=== CONFIRMED PIVOTS WITH ALTERNATION: ${confirmedPivots.length} patterns found ===`);
    confirmedPivots.forEach((det, i) => {
        console.log(`${i+1}. ${det.type.toUpperCase()} at Bar ${det.pivotIdx} (price=${det.price.toFixed(2)}) - Anchor=${det.anchor}, B1=${det.b1}, B2=${det.b2}`);
    });
    
    // Phase 2: Update to highest/lowest in ranges (dynamic small pivots)
    console.log(`\n=== UPDATING TO EXTREMES IN RANGES ===`);
    const finalSPH = [];
    const finalSPL = [];
    
    for (let i = 0; i < confirmedPivots.length; i++) {
        const current = confirmedPivots[i];
        
        if (current.type === 'sph') {
            // Find range between SPLs
            let startIdx = 0;
            let endIdx = data.length - 1;
            
            // Find previous SPL
            for (let j = i - 1; j >= 0; j--) {
                if (confirmedPivots[j].type === 'spl') {
                    startIdx = confirmedPivots[j].pivotIdx;
                    break;
                }
            }
            
            // Find next SPL
            for (let j = i + 1; j < confirmedPivots.length; j++) {
                if (confirmedPivots[j].type === 'spl') {
                    endIdx = confirmedPivots[j].pivotIdx;
                    break;
                }
            }
            
            // Find highest in range
            let highestIdx = current.pivotIdx;
            let highestPrice = data[current.pivotIdx].high;
            
            for (let k = startIdx; k <= endIdx; k++) {
                if (data[k].high > highestPrice) {
                    highestPrice = data[k].high;
                    highestIdx = k;
                }
            }
            
            finalSPH.push(highestIdx);
            console.log(`SPH range [${startIdx}-${endIdx}]: highest at Bar ${highestIdx} (${highestPrice.toFixed(2)})`);
        } else {
            // Find range between SPHs
            let startIdx = 0;
            let endIdx = data.length - 1;
            
            // Find previous SPH
            for (let j = i - 1; j >= 0; j--) {
                if (confirmedPivots[j].type === 'sph') {
                    startIdx = confirmedPivots[j].pivotIdx;
                    break;
                }
            }
            
            // Find next SPH
            for (let j = i + 1; j < confirmedPivots.length; j++) {
                if (confirmedPivots[j].type === 'sph') {
                    endIdx = confirmedPivots[j].pivotIdx;
                    break;
                }
            }
            
            // Find lowest in range
            let lowestIdx = current.pivotIdx;
            let lowestPrice = data[current.pivotIdx].low;
            
            for (let k = startIdx; k <= endIdx; k++) {
                if (data[k].low < lowestPrice) {
                    lowestPrice = data[k].low;
                    lowestIdx = k;
                }
            }
            
            finalSPL.push(lowestIdx);
            console.log(`SPL range [${startIdx}-${endIdx}]: lowest at Bar ${lowestIdx} (${lowestPrice.toFixed(2)})`);
        }
    }
    
    // Phase 3: Large Pivot Detection
    console.log(`\n=== LARGE PIVOT DETECTION ===`);
    const finalLPH = [];
    const finalLPL = [];
    
    // Detect Large Pivot Highs (LPH)
    // LPH triggered when SPL breaks below previous SPL
    for (let i = 1; i < finalSPL.length; i++) {
        const currentSPL = finalSPL[i];
        const prevSPL = finalSPL[i-1];
        
        if (data[currentSPL].low < data[prevSPL].low) {
            console.log(`SPL Break: Bar ${currentSPL} (${data[currentSPL].low.toFixed(2)}) below Bar ${prevSPL} (${data[prevSPL].low.toFixed(2)})`);
            
            // Find highest SPH between previous LPL and current SPL
            let searchStart = 0;
            if (finalLPL.length > 0) {
                searchStart = finalLPL[finalLPL.length - 1];
            }
            
            let lphCandidate = -1;
            let lphPrice = -1;
            
            for (let j = 0; j < finalSPH.length; j++) {
                const sphIdx = finalSPH[j];
                if (sphIdx > searchStart && sphIdx < currentSPL) {
                    if (lphCandidate === -1 || data[sphIdx].high > lphPrice) {
                        lphCandidate = sphIdx;
                        lphPrice = data[sphIdx].high;
                    }
                }
            }
            
            if (lphCandidate !== -1 && !finalLPH.includes(lphCandidate)) {
                finalLPH.push(lphCandidate);
                console.log(`LPH marked at Bar ${lphCandidate} (${lphPrice.toFixed(2)})`);
            }
        }
    }
    
    // Detect Large Pivot Lows (LPL)
    // LPL triggered when SPH breaks above previous SPH
    for (let i = 1; i < finalSPH.length; i++) {
        const currentSPH = finalSPH[i];
        const prevSPH = finalSPH[i-1];
        
        if (data[currentSPH].high > data[prevSPH].high) {
            console.log(`SPH Break: Bar ${currentSPH} (${data[currentSPH].high.toFixed(2)}) above Bar ${prevSPH} (${data[prevSPH].high.toFixed(2)})`);
            
            // Find lowest SPL between previous LPH and current SPH
            let searchStart = 0;
            if (finalLPH.length > 0) {
                searchStart = finalLPH[finalLPH.length - 1];
            }
            
            let lplCandidate = -1;
            let lplPrice = Infinity;
            
            for (let j = 0; j < finalSPL.length; j++) {
                const splIdx = finalSPL[j];
                if (splIdx > searchStart && splIdx < currentSPH) {
                    if (lplCandidate === -1 || data[splIdx].low < lplPrice) {
                        lplCandidate = splIdx;
                        lplPrice = data[splIdx].low;
                    }
                }
            }
            
            if (lplCandidate !== -1 && !finalLPL.includes(lplCandidate)) {
                finalLPL.push(lplCandidate);
                console.log(`LPL marked at Bar ${lplCandidate} (${lplPrice.toFixed(2)})`);
            }
        }
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`SPH Count: ${finalSPH.length} - Bars: [${finalSPH.join(', ')}]`);
    console.log(`SPL Count: ${finalSPL.length} - Bars: [${finalSPL.join(', ')}]`);
    console.log(`LPH Count: ${finalLPH.length} - Bars: [${finalLPH.join(', ')}]`);
    console.log(`LPL Count: ${finalLPL.length} - Bars: [${finalLPL.join(', ')}]`);
    
    return {
        sph: finalSPH,
        spl: finalSPL,
        lph: finalLPH,
        lpl: finalLPL
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectPivots };
}
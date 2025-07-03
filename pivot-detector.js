// pivot-detector-fixed.js
// Methodical bar-by-bar pivot detection with proper alternation during detection

function detectPivots(data) {
    if (data.length < 3) return { sph: [], spl: [], lph: [], lpl: [] };
    
    console.log(`=== STARTING METHODICAL PIVOT DETECTION ON ${data.length} BARS ===`);
    
    const confirmedPivots = [];
    let currentSearchIndex = 0;
    let lastPivotType = null; // Track last confirmed pivot type for alternation
    
    // Phase 1: Systematic bar-by-bar detection with immediate alternation
    while (currentSearchIndex < data.length - 2) {
        console.log(`\n--- Testing from search index ${currentSearchIndex} ---`);
        console.log(`Last pivot type: ${lastPivotType || 'NONE'}`);
        
        let patternFound = false;
        
        // Test each bar starting from currentSearchIndex as potential Anchor
        for (let anchorIdx = currentSearchIndex; anchorIdx < data.length - 2; anchorIdx++) {
            console.log(`\nTesting Bar ${anchorIdx} as Anchor:`);
            const anchor = data[anchorIdx];
            console.log(`  Anchor ${anchorIdx}: Open=${anchor.open.toFixed(2)}, High=${anchor.high.toFixed(2)}, Low=${anchor.low.toFixed(2)}, Close=${anchor.close.toFixed(2)}`);
            
            // Look for SPH pattern first (only if we need SPH for alternation)
            if (lastPivotType !== 'sph') {
                console.log(`  Looking for SPH pattern (alternation allows SPH)...`);
                let sphB1 = -1, sphB2 = -1;
                
                // Find B1 for SPH: first bar after anchor with lower low AND lower close
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
                
                // Find B2 for SPH: second bar after anchor with lower low AND lower close
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
                    currentSearchIndex = sphB2;
                    patternFound = true;
                    console.log(`  Next search will start from Bar ${currentSearchIndex} (B2 position)`);
                    console.log(`  Last pivot type updated to: ${lastPivotType}`);
                    break;
                } else {
                    console.log(`  SPH pattern incomplete: B1=${sphB1}, B2=${sphB2}`);
                }
            } else {
                console.log(`  Skipping SPH pattern (alternation requires SPL next)`);
            }
            
            // Look for SPL pattern (only if we need SPL for alternation)
            if (lastPivotType !== 'spl') {
                console.log(`  Looking for SPL pattern (alternation allows SPL)...`);
                let splB1 = -1, splB2 = -1;
                
                // Find B1 for SPL: first bar after anchor with higher high AND higher close
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
                
                // Find B2 for SPL: second bar after anchor with higher high AND higher close
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
                    currentSearchIndex = splB2;
                    patternFound = true;
                    console.log(`  Next search will start from Bar ${currentSearchIndex} (B2 position)`);
                    console.log(`  Last pivot type updated to: ${lastPivotType}`);
                    break;
                } else {
                    console.log(`  SPL pattern incomplete: B1=${splB1}, B2=${splB2}`);
                }
            } else {
                console.log(`  Skipping SPL pattern (alternation requires SPH next)`);
            }
            
            console.log(`  No valid alternating pattern found with Bar ${anchorIdx} as Anchor`);
        }
        
        // If no pattern found, move to next bar
        if (!patternFound) {
            currentSearchIndex++;
            console.log(`No pattern found, moving search to Bar ${currentSearchIndex}`);
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
    
    // Phase 3: Detect large pivots
    console.log(`\n=== DETECTING LARGE PIVOTS ===`);
    const lph = [];
    const lpl = [];
    
    // LPH: when SPL breaks below previous SPL
    for (let i = 1; i < finalSPL.length; i++) {
        const currentSPL = finalSPL[i];
        const prevSPL = finalSPL[i - 1];
        
        console.log(`Checking SPL break: Bar ${currentSPL} (${data[currentSPL].low.toFixed(2)}) vs Bar ${prevSPL} (${data[prevSPL].low.toFixed(2)})`);
        
        if (data[currentSPL].low < data[prevSPL].low) {
            console.log(`✓ SPL break detected! ${data[currentSPL].low.toFixed(2)} < ${data[prevSPL].low.toFixed(2)}`);
            
            // Find highest SPH between last LPL and current break
            const lastLPLIdx = lpl.length > 0 ? lpl[lpl.length - 1] : -1;
            let highestSPH = null;
            let highestPrice = -Infinity;
            
            for (const sphIdx of finalSPH) {
                if (sphIdx > lastLPLIdx && sphIdx < currentSPL) {
                    if (data[sphIdx].high > highestPrice) {
                        highestPrice = data[sphIdx].high;
                        highestSPH = sphIdx;
                    }
                }
            }
            
            if (highestSPH !== null && !lph.includes(highestSPH)) {
                lph.push(highestSPH);
                console.log(`✓ LPH marked at Bar ${highestSPH} (${data[highestSPH].high.toFixed(2)})`);
            }
        }
    }
    
    // LPL: when SPH breaks above previous SPH
    for (let i = 1; i < finalSPH.length; i++) {
        const currentSPH = finalSPH[i];
        const prevSPH = finalSPH[i - 1];
        
        console.log(`Checking SPH break: Bar ${currentSPH} (${data[currentSPH].high.toFixed(2)}) vs Bar ${prevSPH} (${data[prevSPH].high.toFixed(2)})`);
        
        if (data[currentSPH].high > data[prevSPH].high) {
            console.log(`✓ SPH break detected! ${data[currentSPH].high.toFixed(2)} > ${data[prevSPH].high.toFixed(2)}`);
            
            // Find lowest SPL between last LPH and current break
            const lastLPHIdx = lph.length > 0 ? lph[lph.length - 1] : -1;
            let lowestSPL = null;
            let lowestPrice = Infinity;
            
            for (const splIdx of finalSPL) {
                if (splIdx > lastLPHIdx && splIdx < currentSPH) {
                    if (data[splIdx].low < lowestPrice) {
                        lowestPrice = data[splIdx].low;
                        lowestSPL = splIdx;
                    }
                }
            }
            
            if (lowestSPL !== null && !lpl.includes(lowestSPL)) {
                lpl.push(lowestSPL);
                console.log(`✓ LPL marked at Bar ${lowestSPL} (${data[lowestSPL].low.toFixed(2)})`);
            }
        }
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`SPH: ${finalSPH.length} points - Indices: [${finalSPH.join(', ')}]`);
    console.log(`SPL: ${finalSPL.length} points - Indices: [${finalSPL.join(', ')}]`);
    console.log(`LPH: ${lph.length} points - Indices: [${lph.join(', ')}]`);
    console.log(`LPL: ${lpl.length} points - Indices: [${lpl.join(', ')}]`);
    console.log(`Total: ${finalSPH.length + finalSPL.length + lph.length + lpl.length} pivot points`);
    
    return { 
        sph: finalSPH, 
        spl: finalSPL, 
        lph: lph, 
        lpl: lpl 
    };
}
// pivot-detector-complete-fixed.js
// COMPLETE FIX: Two-stage optimization with parallel anchor testing and range relocation

function detectPivots(data) {
    if (!data || !Array.isArray(data) || data.length < 3) {
        console.warn('Invalid data provided to detectPivots:', data);
        return { sph: [], spl: [], lph: [], lpl: [] };
    }
    
    console.log(`=== STARTING COMPLETE PIVOT DETECTION ON ${data.length} BARS ===`);
    
    const confirmedPivots = [];
    let currentSearchIndex = 0;
    let lastPivotType = null;
    
    // Phase 1: Parallel anchor testing with immediate range optimization
    while (currentSearchIndex < data.length - 2) {
        console.log(`\n--- Starting search from index ${currentSearchIndex} ---`);
        console.log(`Looking for: ${lastPivotType === null ? 'SPH (first pivot)' : (lastPivotType === 'sph' ? 'SPL' : 'SPH')}`);
        
        let potentialAnchors = [];
        let patternFound = false;
        let pivotResult = null;
        
        // Add first anchor to start testing
        potentialAnchors.push(currentSearchIndex);
        console.log(`Added initial anchor: Bar ${currentSearchIndex}`);
        
        // Test each subsequent bar
        for (let currentBarIdx = currentSearchIndex + 1; currentBarIdx < data.length && !patternFound; currentBarIdx++) {
            console.log(`\n  Processing Bar ${currentBarIdx}:`);
            
            // Test all existing potential anchors with current bar
            for (let i = 0; i < potentialAnchors.length && !patternFound; i++) {
                const anchorIdx = potentialAnchors[i];
                
                // Determine what pivot type we're looking for
                const lookingForSPH = (lastPivotType === null || lastPivotType === 'spl');
                
                if (lookingForSPH) {
                    // Test for SPH pattern
                    const sphResult = testSPHPattern(data, anchorIdx, currentBarIdx);
                    if (sphResult.complete) {
                        console.log(`    ✓ SPH PATTERN FOUND: Anchor=${anchorIdx}, B1=${sphResult.b1}, B2=${sphResult.b2}`);
                        console.log(`    ✓ SPH placed at Bar ${sphResult.pivotIdx} (highest in range ${anchorIdx}-${sphResult.b2})`);
                        
                        pivotResult = {
                            type: 'sph',
                            pivotIdx: sphResult.pivotIdx,
                            price: sphResult.price,
                            anchor: anchorIdx,
                            b1: sphResult.b1,
                            b2: sphResult.b2
                        };
                        patternFound = true;
                    }
                } else {
                    // Test for SPL pattern
                    const splResult = testSPLPattern(data, anchorIdx, currentBarIdx);
                    if (splResult.complete) {
                        console.log(`    ✓ SPL PATTERN FOUND: Anchor=${anchorIdx}, B1=${splResult.b1}, B2=${splResult.b2}`);
                        console.log(`    ✓ SPL placed at Bar ${splResult.pivotIdx} (lowest in range ${anchorIdx}-${splResult.b2})`);
                        
                        pivotResult = {
                            type: 'spl',
                            pivotIdx: splResult.pivotIdx,
                            price: splResult.price,
                            anchor: anchorIdx,
                            b1: splResult.b1,
                            b2: splResult.b2
                        };
                        patternFound = true;
                    }
                }
            }
            
            // If no pattern found yet, add current bar as new potential anchor
            if (!patternFound && currentBarIdx < data.length - 2) {
                potentialAnchors.push(currentBarIdx);
                console.log(`    Added new potential anchor: Bar ${currentBarIdx}`);
            }
        }
        
        // If pattern found, record it and apply range optimization
        if (patternFound) {
            confirmedPivots.push(pivotResult);
            lastPivotType = pivotResult.type;
            
            // Stage 2: Range optimization - relocate previous pivot to true extreme
            if (confirmedPivots.length >= 2) {
                relocatePreviousPivot(confirmedPivots, data);
            }
            
            currentSearchIndex = pivotResult.b2; // Start next search from B2
            console.log(`  ✓ CONFIRMED: ${pivotResult.type.toUpperCase()} at Bar ${pivotResult.pivotIdx}`);
            console.log(`  Next search starts from Bar ${currentSearchIndex}`);
        } else {
            console.log(`  No more patterns found. Ending search.`);
            break;
        }
    }
    
    console.log(`\n=== PARALLEL TESTING RESULTS: ${confirmedPivots.length} pivots found ===`);
    confirmedPivots.forEach((pivot, i) => {
        console.log(`${i+1}. ${pivot.type.toUpperCase()} at Bar ${pivot.pivotIdx} (price=${pivot.price.toFixed(2)}) - A=${pivot.anchor}, B1=${pivot.b1}, B2=${pivot.b2}`);
    });
    
    // Convert to final arrays
    const finalSPH = [];
    const finalSPL = [];
    
    confirmedPivots.forEach(pivot => {
        if (pivot.type === 'sph') {
            finalSPH.push(pivot.pivotIdx);
        } else {
            finalSPL.push(pivot.pivotIdx);
        }
    });
    
    // Phase 3: Large Pivot Detection
    console.log(`\n=== LARGE PIVOT DETECTION ===`);
    const finalLPH = [];
    const finalLPL = [];
    
    // Detect Large Pivot Highs (LPH)
    for (let i = 1; i < finalSPL.length; i++) {
        const currentSPL = finalSPL[i];
        const prevSPL = finalSPL[i-1];
        
        if (data[currentSPL].low < data[prevSPL].low) {
            console.log(`SPL Break: Bar ${currentSPL} (${data[currentSPL].low.toFixed(2)}) below Bar ${prevSPL} (${data[prevSPL].low.toFixed(2)})`);
            
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
    for (let i = 1; i < finalSPH.length; i++) {
        const currentSPH = finalSPH[i];
        const prevSPH = finalSPH[i-1];
        
        if (data[currentSPH].high > data[prevSPH].high) {
            console.log(`SPH Break: Bar ${currentSPH} (${data[currentSPH].high.toFixed(2)}) above Bar ${prevSPH} (${data[prevSPH].high.toFixed(2)})`);
            
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

// Stage 2: Range optimization function
function relocatePreviousPivot(confirmedPivots, data) {
    if (confirmedPivots.length < 2) return;
    
    const currentPivot = confirmedPivots[confirmedPivots.length - 1];
    const previousPivot = confirmedPivots[confirmedPivots.length - 2];
    
    console.log(`\n  === STAGE 2: RANGE OPTIMIZATION ===`);
    console.log(`  Current pivot: ${currentPivot.type.toUpperCase()} at Bar ${currentPivot.pivotIdx}`);
    console.log(`  Previous pivot: ${previousPivot.type.toUpperCase()} at Bar ${previousPivot.pivotIdx}`);
    
    if (currentPivot.type === 'spl' && previousPivot.type === 'sph') {
        // Relocate previous SPH to highest between two SPLs
        relocateSPH(confirmedPivots, data);
    } else if (currentPivot.type === 'sph' && previousPivot.type === 'spl') {
        // Relocate previous SPL to lowest between two SPHs
        relocateSPL(confirmedPivots, data);
    }
}

function relocateSPH(confirmedPivots, data) {
    const currentSPL = confirmedPivots[confirmedPivots.length - 1]; // Just confirmed SPL
    const previousSPH = confirmedPivots[confirmedPivots.length - 2]; // SPH to relocate
    
    // Find SPL before the previous SPH
    let prevSPL = null;
    for (let i = confirmedPivots.length - 3; i >= 0; i--) {
        if (confirmedPivots[i].type === 'spl') {
            prevSPL = confirmedPivots[i];
            break;
        }
    }
    
    // Define range: from previous SPL to current SPL
    const startIdx = prevSPL ? prevSPL.pivotIdx : 0;
    const endIdx = currentSPL.pivotIdx;
    
    console.log(`  Relocating SPH in range [${startIdx}-${endIdx}]`);
    
    // Find actual highest in range
    let highestIdx = startIdx;
    let highestPrice = data[startIdx].high;
    
    for (let i = startIdx; i <= endIdx; i++) {
        if (data[i].high > highestPrice) {
            highestPrice = data[i].high;
            highestIdx = i;
        }
    }
    
    if (highestIdx !== previousSPH.pivotIdx) {
        console.log(`  ✓ SPH RELOCATED: Bar ${previousSPH.pivotIdx} → Bar ${highestIdx} (${previousSPH.price.toFixed(2)} → ${highestPrice.toFixed(2)})`);
        previousSPH.pivotIdx = highestIdx;
        previousSPH.price = highestPrice;
    } else {
        console.log(`  ✓ SPH already at optimal position: Bar ${highestIdx}`);
    }
}

function relocateSPL(confirmedPivots, data) {
    const currentSPH = confirmedPivots[confirmedPivots.length - 1]; // Just confirmed SPH
    const previousSPL = confirmedPivots[confirmedPivots.length - 2]; // SPL to relocate
    
    // Find SPH before the previous SPL
    let prevSPH = null;
    for (let i = confirmedPivots.length - 3; i >= 0; i--) {
        if (confirmedPivots[i].type === 'sph') {
            prevSPH = confirmedPivots[i];
            break;
        }
    }
    
    // Define range: from previous SPH to current SPH
    const startIdx = prevSPH ? prevSPH.pivotIdx : 0;
    const endIdx = currentSPH.pivotIdx;
    
    console.log(`  Relocating SPL in range [${startIdx}-${endIdx}]`);
    
    // Find actual lowest in range
    let lowestIdx = startIdx;
    let lowestPrice = data[startIdx].low;
    
    for (let i = startIdx; i <= endIdx; i++) {
        if (data[i].low < lowestPrice) {
            lowestPrice = data[i].low;
            lowestIdx = i;
        }
    }
    
    if (lowestIdx !== previousSPL.pivotIdx) {
        console.log(`  ✓ SPL RELOCATED: Bar ${previousSPL.pivotIdx} → Bar ${lowestIdx} (${previousSPL.price.toFixed(2)} → ${lowestPrice.toFixed(2)})`);
        previousSPL.pivotIdx = lowestIdx;
        previousSPL.price = lowestPrice;
    } else {
        console.log(`  ✓ SPL already at optimal position: Bar ${lowestIdx}`);
    }
}

// Stage 1: Enhanced pattern testing with full range scanning
function testSPHPattern(data, anchorIdx, currentBarIdx) {
    const anchor = data[anchorIdx];
    let b1 = -1, b2 = -1;
    
    // Find B1: first bar after anchor with lower low AND lower close
    for (let i = anchorIdx + 1; i <= currentBarIdx; i++) {
        const bar = data[i];
        if (bar.low < anchor.low && bar.close < anchor.close) {
            b1 = i;
            break;
        }
    }
    
    // Find B2: first bar after B1 with lower low AND lower close than anchor
    if (b1 !== -1) {
        for (let i = b1 + 1; i <= currentBarIdx; i++) {
            const bar = data[i];
            if (bar.low < anchor.low && bar.close < anchor.close) {
                b2 = i;
                break;
            }
        }
    }
    
    // If complete pattern found, find highest in ENTIRE range from anchor to B2
    if (b1 !== -1 && b2 !== -1) {
        let highestIdx = anchorIdx;
        let highestPrice = anchor.high;
        
        // Scan entire range from anchor to B2
        for (let i = anchorIdx; i <= b2; i++) {
            if (data[i].high > highestPrice) {
                highestPrice = data[i].high;
                highestIdx = i;
            }
        }
        
        return {
            complete: true,
            b1: b1,
            b2: b2,
            pivotIdx: highestIdx,
            price: highestPrice
        };
    }
    
    return { complete: false };
}

function testSPLPattern(data, anchorIdx, currentBarIdx) {
    const anchor = data[anchorIdx];
    let b1 = -1, b2 = -1;
    
    // Find B1: first bar after anchor with higher high AND higher close
    for (let i = anchorIdx + 1; i <= currentBarIdx; i++) {
        const bar = data[i];
        if (bar.high > anchor.high && bar.close > anchor.close) {
            b1 = i;
            break;
        }
    }
    
    // Find B2: first bar after B1 with higher high AND higher close than anchor
    if (b1 !== -1) {
        for (let i = b1 + 1; i <= currentBarIdx; i++) {
            const bar = data[i];
            if (bar.high > anchor.high && bar.close > anchor.close) {
                b2 = i;
                break;
            }
        }
    }
    
    // If complete pattern found, find lowest in ENTIRE range from anchor to B2
    if (b1 !== -1 && b2 !== -1) {
        let lowestIdx = anchorIdx;
        let lowestPrice = anchor.low;
        
        // Scan entire range from anchor to B2
        for (let i = anchorIdx; i <= b2; i++) {
            if (data[i].low < lowestPrice) {
                lowestPrice = data[i].low;
                lowestIdx = i;
            }
        }
        
        return {
            complete: true,
            b1: b1,
            b2: b2,
            pivotIdx: lowestIdx,
            price: lowestPrice
        };
    }
    
    return { complete: false };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectPivots };
}
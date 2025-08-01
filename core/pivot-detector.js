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
    
    // Phase 3: NEW Large Pivot Detection with Your Rules (COMPLETELY REPLACED)
    console.log(`\n=== NEW LARGE PIVOT DETECTION WITH BAR-BY-BAR PROCESSING ===`);
    const finalLPH = [];
    const finalLPL = [];
    
    if (finalSPH.length === 0 || finalSPL.length === 0) {
        console.log('Insufficient SPH/SPL for large pivot detection');
    } else {
        // Rule 1: Start with LPL detection
        let expectingLPL = true;
        let currentSPHRefIdx = 0; // Index in finalSPH array  
        let currentSPLRefIdx = 0; // Index in finalSPL array
        
        console.log(`\n🔄 Starting with LPL detection using first SPH as reference...`);
        console.log(`Available SPH: [${finalSPH.join(', ')}]`);
        console.log(`Available SPL: [${finalSPL.join(', ')}]`);
        
        // Bar-by-bar processing from start to end
        for (let barIdx = 0; barIdx < data.length; barIdx++) {
            
            if (expectingLPL) {
                // Rule 3: LPL Detection Logic
                if (currentSPHRefIdx >= finalSPH.length) {
                    console.log(`No more SPH references available for LPL detection`);
                    break;
                }
                
                const refSPHBarIdx = finalSPH[currentSPHRefIdx];
                const refSPHHigh = data[refSPHBarIdx].high;
                
                // Only check bars that come after the reference SPH
                if (barIdx > refSPHBarIdx) {
                    const currentHigh = data[barIdx].high;
                    
                    // Check if current bar breaks the SPH high
                    if (currentHigh > refSPHHigh) {
                        console.log(`🔴 Bar ${barIdx} (high=${currentHigh.toFixed(2)}) BREAKS SPH${currentSPHRefIdx} at Bar ${refSPHBarIdx} (high=${refSPHHigh.toFixed(2)})`);
                        
                        // Find all SPLs after the most recent LPH, then pick the lowest one
                        let mostRecentLPHBarIdx = -1;
                        if (finalLPH.length > 0) {
                            mostRecentLPHBarIdx = Math.max(...finalLPH);
                        }
                        
                        let candidateSPLs = [];
                        for (let splIdx = 0; splIdx < finalSPL.length; splIdx++) {
                            const splBarIdx = finalSPL[splIdx];
                            if (splBarIdx < barIdx && splBarIdx > mostRecentLPHBarIdx) {
                                candidateSPLs.push(splBarIdx);
                            }
                        }
                        
                        // Find the lowest SPL among candidates
                        let lowestSPLBarIdx = -1;
                        let lowestPrice = Infinity;
                        
                        for (let splBarIdx of candidateSPLs) {
                            if (data[splBarIdx].low < lowestPrice) {
                                lowestPrice = data[splBarIdx].low;
                                lowestSPLBarIdx = splBarIdx;
                            }
                        }
                        
                        // Mark the lowest SPL as LPL if found and not already marked
                        if (lowestSPLBarIdx !== -1 && !finalLPL.includes(lowestSPLBarIdx)) {
                            finalLPL.push(lowestSPLBarIdx);
                            console.log(`✅ LPL MARKED at Bar ${lowestSPLBarIdx} (low=${data[lowestSPLBarIdx].low.toFixed(2)}) - lowest SPL after most recent LPH`);
                            
                            // Rule 2: Switch to LPH detection
                            expectingLPL = false;
                            console.log(`🔄 Now expecting LPH detection...`);
                        }
                        
                        // Move to next SPH reference for future LPL detections
                        currentSPHRefIdx++;
                    }
                }
                
                // Rule 4: If we reach the next SPH without any breaks, switch SPH reference
                if (currentSPHRefIdx < finalSPH.length - 1) {
                    const nextSPHBarIdx = finalSPH[currentSPHRefIdx + 1];
                    if (barIdx >= nextSPHBarIdx) {
                        console.log(`📍 Reached next SPH at Bar ${nextSPHBarIdx} without breaks - switching reference`);
                        currentSPHRefIdx++;
                    }
                }
                
            } else {
                // Rule 4: LPH Detection Logic (vice versa)
                if (currentSPLRefIdx >= finalSPL.length) {
                    console.log(`No more SPL references available for LPH detection`);
                    break;
                }
                
                const refSPLBarIdx = finalSPL[currentSPLRefIdx];
                const refSPLLow = data[refSPLBarIdx].low;
                
                // Only check bars that come after the reference SPL
                if (barIdx > refSPLBarIdx) {
                    const currentLow = data[barIdx].low;
                    
                    // Check if current bar breaks the SPL low
                    if (currentLow < refSPLLow) {
                        console.log(`🔵 Bar ${barIdx} (low=${currentLow.toFixed(2)}) BREAKS SPL${currentSPLRefIdx} at Bar ${refSPLBarIdx} (low=${refSPLLow.toFixed(2)})`);
                        
                        // Find all SPHs after the most recent LPL, then pick the highest one
                        let mostRecentLPLBarIdx = -1;
                        if (finalLPL.length > 0) {
                            mostRecentLPLBarIdx = Math.max(...finalLPL);
                        }
                        
                        let candidateSPHs = [];
                        for (let sphIdx = 0; sphIdx < finalSPH.length; sphIdx++) {
                            const sphBarIdx = finalSPH[sphIdx];
                            if (sphBarIdx < barIdx && sphBarIdx > mostRecentLPLBarIdx) {
                                candidateSPHs.push(sphBarIdx);
                            }
                        }
                        
                        // Find the highest SPH among candidates
                        let highestSPHBarIdx = -1;
                        let highestPrice = -Infinity;
                        
                        for (let sphBarIdx of candidateSPHs) {
                            if (data[sphBarIdx].high > highestPrice) {
                                highestPrice = data[sphBarIdx].high;
                                highestSPHBarIdx = sphBarIdx;
                            }
                        }
                        
                        // Mark the highest SPH as LPH if found and not already marked
                        if (highestSPHBarIdx !== -1 && !finalLPH.includes(highestSPHBarIdx)) {
                            finalLPH.push(highestSPHBarIdx);
                            console.log(`✅ LPH MARKED at Bar ${highestSPHBarIdx} (high=${data[highestSPHBarIdx].high.toFixed(2)}) - highest SPH after most recent LPL`);
                            
                            // Rule 2: Switch to LPL detection
                            expectingLPL = true;
                            console.log(`🔄 Now expecting LPL detection...`);
                        }
                        
                        // Move to next SPL reference for future LPH detections
                        currentSPLRefIdx++;
                    }
                }
                
                // Rule 4: If we reach the next SPL without any breaks, switch SPL reference
                if (currentSPLRefIdx < finalSPL.length - 1) {
                    const nextSPLBarIdx = finalSPL[currentSPLRefIdx + 1];
                    if (barIdx >= nextSPLBarIdx) {
                        console.log(`📍 Reached next SPL at Bar ${nextSPLBarIdx} without breaks - switching reference`);
                        currentSPLRefIdx++;
                    }
                }
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

// Stage 2: Range optimization function (UNCHANGED)
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

// Stage 1: Enhanced pattern testing with full range scanning (UNCHANGED)
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
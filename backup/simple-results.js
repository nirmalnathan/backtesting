// simple-results.js - ENHANCED VERSION WITH RULE CONFIGURATION DISPLAY
// Display backtest results in a user-friendly format with active rules shown

// Display results function
function displaySimpleResults(trades) {
    console.log('=== DISPLAYING ENHANCED BACKTEST RESULTS ===');
    
    if (!trades || trades.length === 0) {
        showStatus('No trades generated in backtest', 'info');
        return;
    }
    
    // Calculate summary statistics
    const stats = calculateStats(trades);
    
    // Update summary display with rule configuration
    updateSummaryStats(stats);
    
    // Update trades table
    updateTradesTable(trades);
    
    // Show results section
    showResultsSection();
    
    showStatus(`Backtest completed: ${trades.length} trades, ${stats.totalPoints.toFixed(2)} points`, 'success');
}

// Calculate summary statistics
function calculateStats(trades) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.points > 0);
    const losingTrades = trades.filter(t => t.points <= 0);
    const eodExits = trades.filter(t => t.exitRule.includes('EOD'));
    const stopLossExits = trades.filter(t => t.exitRule.includes('Stop Loss'));
    
    const totalPoints = trades.reduce((sum, t) => sum + t.points, 0);
    const avgPoints = totalTrades > 0 ? totalPoints / totalTrades : 0;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    const avgWinPoints = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, t) => sum + t.points, 0) / winningTrades.length : 0;
    const avgLossPoints = losingTrades.length > 0 ? 
        losingTrades.reduce((sum, t) => sum + t.points, 0) / losingTrades.length : 0;
    
    const maxWin = Math.max(...trades.map(t => t.points));
    const maxLoss = Math.min(...trades.map(t => t.points));
    
    // Rule-specific statistics
    const lphEntries = trades.filter(t => t.entryRule.includes('LPH')).length;
    const lplEntries = trades.filter(t => t.entryRule.includes('LPL')).length;
    const gapEntries = trades.filter(t => t.entryRule.includes('GAP')).length;
    
    return {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalPoints,
        avgPoints,
        winRate,
        avgWinPoints,
        avgLossPoints,
        maxWin,
        maxLoss,
        eodExits: eodExits.length,
        stopLossExits: stopLossExits.length,
        lphEntries,
        lplEntries,
        gapEntries
    };
}

// Update summary statistics display with rule configuration
function updateSummaryStats(stats) {
    // Create or update summary section
    let summaryDiv = document.getElementById('backtest-summary');
    if (!summaryDiv) {
        summaryDiv = document.createElement('div');
        summaryDiv.id = 'backtest-summary';
        summaryDiv.className = 'backtest-summary';
        
        // Insert after the controls
        const controlsDiv = document.querySelector('.simple-backtest-controls');
        if (controlsDiv) {
            controlsDiv.parentNode.insertBefore(summaryDiv, controlsDiv.nextSibling);
        } else {
            document.body.appendChild(summaryDiv);
        }
    }
    
    // Generate active rules display
    const activeRulesHTML = generateActiveRulesHTML();
    
    summaryDiv.innerHTML = `
        <h3>Backtest Summary</h3>
        
        ${activeRulesHTML}
        
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.totalTrades}</div>
                <div class="stat-label">Total Trades</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalPoints.toFixed(2)}</div>
                <div class="stat-label">Total Points</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.winRate.toFixed(1)}%</div>
                <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.avgPoints.toFixed(2)}</div>
                <div class="stat-label">Avg Points/Trade</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.winningTrades}</div>
                <div class="stat-label">Winning Trades</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.losingTrades}</div>
                <div class="stat-label">Losing Trades</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.avgWinPoints.toFixed(2)}</div>
                <div class="stat-label">Avg Win Points</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.avgLossPoints.toFixed(2)}</div>
                <div class="stat-label">Avg Loss Points</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.maxWin.toFixed(2)}</div>
                <div class="stat-label">Max Win</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.maxLoss.toFixed(2)}</div>
                <div class="stat-label">Max Loss</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.eodExits}</div>
                <div class="stat-label">EOD Exits</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.stopLossExits}</div>
                <div class="stat-label">Stop Loss Exits</div>
            </div>
        </div>
        
        <div class="rule-specific-stats">
            <h4>Rule-Specific Statistics</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.lphEntries}</div>
                    <div class="stat-label">LPH Entries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.lplEntries}</div>
                    <div class="stat-label">LPL Entries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.gapEntries}</div>
                    <div class="stat-label">Gap Entries</div>
                </div>
            </div>
        </div>
    `;
}

// Generate active rules HTML display
function generateActiveRulesHTML() {
    if (!window.ruleConfig) {
        return '<div class="active-rules"><h4>Rules Configuration: Not Available</h4></div>';
    }
    
    const entryRules = [];
    const exitRules = [];
    const specialFeatures = [];
    
    // Entry rules
    if (window.ruleConfig.entryLphLpl) {
        entryRules.push('✅ LPH Break Entry (LONG above LPH, SHORT below LPL)');
    } else {
        entryRules.push('❌ LPH Break Entry (DISABLED)');
    }
    
    // Gap handling
    if (window.ruleConfig.gapHandling) {
        specialFeatures.push('✅ Gap Handling (Enter at market open if gap beyond trigger)');
    } else {
        specialFeatures.push('❌ Gap Handling (DISABLED)');
    }
    
    // Exit rules
    if (window.ruleConfig.stopLoss) {
        exitRules.push(`✅ Stop Loss (${window.ruleConfig.stopLossPercent}% against position)`);
    } else {
        exitRules.push('❌ Stop Loss (DISABLED)');
    }
    
    if (window.ruleConfig.eodExit) {
        exitRules.push('✅ End of Day Exit (Mandatory close at day end)');
    } else {
        exitRules.push('❌ End of Day Exit (DISABLED)');
    }
    
    // Daily reset
    if (window.ruleConfig.dailyReset) {
        specialFeatures.push('✅ Daily Reset (Fresh start each day, no re-trading levels)');
    } else {
        specialFeatures.push('❌ Daily Reset (DISABLED - allows re-trading same levels)');
    }
    
    return `
        <div class="active-rules">
            <h4>Active Rules Configuration</h4>
            <div class="rule-sections">
                <div class="rule-section">
                    <h5>Entry Rules</h5>
                    <ul>
                        ${entryRules.map(rule => `<li>${rule}</li>`).join('')}
                    </ul>
                </div>
                <div class="rule-section">
                    <h5>Exit Rules</h5>
                    <ul>
                        ${exitRules.map(rule => `<li>${rule}</li>`).join('')}
                    </ul>
                </div>
                <div class="rule-section">
                    <h5>Special Features</h5>
                    <ul>
                        ${specialFeatures.map(rule => `<li>${rule}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
        
        <style>
            .active-rules {
                background: #e8f4fd;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border: 1px solid #bee5eb;
            }
            
            .active-rules h4 {
                margin: 0 0 15px 0;
                color: #0c5460;
                font-size: 16px;
            }
            
            .rule-sections {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .rule-section h5 {
                margin: 0 0 8px 0;
                color: #495057;
                font-size: 14px;
                font-weight: bold;
            }
            
            .rule-section ul {
                margin: 0;
                padding-left: 0;
                list-style: none;
            }
            
            .rule-section li {
                margin: 5px 0;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .rule-specific-stats {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
            }
            
            .rule-specific-stats h4 {
                margin: 0 0 15px 0;
                color: #495057;
                font-size: 16px;
            }
    `;
}

// Update trades table
function updateTradesTable(trades) {
    let tableDiv = document.getElementById('trades-table-container');
    if (!tableDiv) {
        tableDiv = document.createElement('div');
        tableDiv.id = 'trades-table-container';
        tableDiv.className = 'trades-table-container';
        
        const summaryDiv = document.getElementById('backtest-summary');
        if (summaryDiv) {
            summaryDiv.parentNode.insertBefore(tableDiv, summaryDiv.nextSibling);
        }
    }
    
    let tableHTML = `
        <h3>Trade Details</h3>
        <div class="table-wrapper">
            <table class="trades-table">
                <thead>
                    <tr>
                        <th>Trade #</th>
                        <th>Direction</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Entry Price</th>
                        <th>Exit Price</th>
                        <th>Points</th>
                        <th>Duration</th>
                        <th>Entry Rule</th>
                        <th>Exit Rule</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    trades.forEach(trade => {
        const entryTime = new Date(trade.entryTime).toLocaleString();
        const exitTime = new Date(trade.exitTime).toLocaleString();
        const resultClass = trade.isWin ? 'win' : 'loss';
        const resultText = trade.isWin ? 'WIN' : 'LOSS';
        
        tableHTML += `
            <tr class="${resultClass}">
                <td>${trade.tradeId}</td>
                <td><strong>${trade.direction}</strong></td>
                <td>${entryTime}</td>
                <td>${exitTime}</td>
                <td>${trade.entryPrice.toFixed(2)}</td>
                <td>${trade.exitPrice.toFixed(2)}</td>
                <td class="points">${trade.points.toFixed(2)}</td>
                <td>${trade.duration}</td>
                <td>${trade.entryRule}</td>
                <td>${trade.exitRule}</td>
                <td class="result">${resultText}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    tableDiv.innerHTML = tableHTML;
}

// Show results section
function showResultsSection() {
    const summaryDiv = document.getElementById('backtest-summary');
    const tableDiv = document.getElementById('trades-table-container');
    
    if (summaryDiv) summaryDiv.style.display = 'block';
    if (tableDiv) tableDiv.style.display = 'block';
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
    } else {
        console.log(`Status (${type}): ${message}`);
    }
}

// Export function for global access
if (typeof window !== 'undefined') {
    window.displaySimpleResults = displaySimpleResults;
}
// backtest/ui/results-summary.js
// Summary statistics and metrics display

class ResultsSummary {
    constructor() {
        this.lastStats = null;
    }
    
    // Calculate enhanced statistics
    calculateEnhancedStats(trades) {
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.points > 0);
        const losingTrades = trades.filter(t => t.points <= 0);
        
        const totalPoints = trades.reduce((sum, t) => sum + t.points, 0);
        const avgPoints = totalTrades > 0 ? totalPoints / totalTrades : 0;
        const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
        
        const avgWinPoints = winningTrades.length > 0 ? 
            winningTrades.reduce((sum, t) => sum + t.points, 0) / winningTrades.length : 0;
        const avgLossPoints = losingTrades.length > 0 ? 
            losingTrades.reduce((sum, t) => sum + t.points, 0) / losingTrades.length : 0;
        
        const maxWin = Math.max(...trades.map(t => t.points));
        const maxLoss = Math.min(...trades.map(t => t.points));
        
        // Exit rule analysis
        const eodExits = trades.filter(t => t.exitRule.includes('EOD'));
        const stopLossExits = trades.filter(t => t.exitRule.includes('Stop Loss'));
        
        // Entry rule analysis
        const lphEntries = trades.filter(t => t.entryRule.includes('LPH'));
        const lplEntries = trades.filter(t => t.entryRule.includes('LPL'));
        const gapEntries = trades.filter(t => t.entryRule.includes('GAP'));
        
        // Direction analysis
        const longTrades = trades.filter(t => t.direction === 'LONG');
        const shortTrades = trades.filter(t => t.direction === 'SHORT');
        
        // Profit factor
        const winPoints = winningTrades.reduce((sum, t) => sum + t.points, 0);
        const lossPoints = Math.abs(losingTrades.reduce((sum, t) => sum + t.points, 0));
        const profitFactor = lossPoints > 0 ? winPoints / lossPoints : winPoints > 0 ? Infinity : 0;
        
        // Average duration
        const avgDuration = trades.reduce((sum, t) => sum + t.duration, 0) / totalTrades;
        
        // Calculate drawdown statistics
        const drawdownStats = this.calculateDrawdownStats(trades);
        
        // Calculate Calmar ratio (Annual return / Max Drawdown)
        const calmarRatio = drawdownStats.maxDrawdownPercent > 0 ? 
            Math.abs(totalPoints / drawdownStats.maxDrawdownPercent) : 0;
        
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
            profitFactor,
            avgDuration,
            calmarRatio,
            
            // Drawdown statistics
            maxDrawdownPoints: drawdownStats.maxDrawdownPoints,
            maxDrawdownPercent: drawdownStats.maxDrawdownPercent,
            maxDrawdownDuration: drawdownStats.maxDrawdownDuration,
            
            // Exit analysis
            eodExits: eodExits.length,
            stopLossExits: stopLossExits.length,
            
            // Entry analysis
            lphEntries: lphEntries.length,
            lplEntries: lplEntries.length,
            gapEntries: gapEntries.length,
            
            // Direction analysis
            longTrades: {
                count: longTrades.length,
                winRate: longTrades.length > 0 ? (longTrades.filter(t => t.points > 0).length / longTrades.length) * 100 : 0,
                totalPoints: longTrades.reduce((sum, t) => sum + t.points, 0)
            },
            shortTrades: {
                count: shortTrades.length,
                winRate: shortTrades.length > 0 ? (shortTrades.filter(t => t.points > 0).length / shortTrades.length) * 100 : 0,
                totalPoints: shortTrades.reduce((sum, t) => sum + t.points, 0)
            }
        };
    }
    
    // Calculate maximum drawdown statistics
    calculateDrawdownStats(trades) {
        if (!trades || trades.length === 0) {
            return {
                maxDrawdownPoints: 0,
                maxDrawdownPercent: 0,
                maxDrawdownDuration: 0
            };
        }
        
        let runningTotal = 0;
        let peak = 0;
        let maxDrawdownPoints = 0;
        let maxDrawdownPercent = 0;
        let drawdownDuration = 0;
        let maxDrawdownDuration = 0;
        let drawdownStartIndex = -1;
        
        trades.forEach((trade, index) => {
            runningTotal += trade.points;
            
            // Update peak if we have a new high
            if (runningTotal > peak) {
                peak = runningTotal;
                // If we were in drawdown, calculate duration and reset
                if (drawdownStartIndex >= 0) {
                    drawdownDuration = index - drawdownStartIndex;
                    maxDrawdownDuration = Math.max(maxDrawdownDuration, drawdownDuration);
                    drawdownStartIndex = -1;
                }
            } else {
                // We are in drawdown
                if (drawdownStartIndex === -1) {
                    drawdownStartIndex = index;
                }
                
                const currentDrawdownPoints = peak - runningTotal;
                const currentDrawdownPercent = peak > 0 ? (currentDrawdownPoints / Math.abs(peak)) * 100 : 0;
                
                // Update maximum drawdown
                if (currentDrawdownPoints > maxDrawdownPoints) {
                    maxDrawdownPoints = currentDrawdownPoints;
                }
                if (currentDrawdownPercent > maxDrawdownPercent) {
                    maxDrawdownPercent = currentDrawdownPercent;
                }
            }
        });
        
        // Check if we ended in a drawdown
        if (drawdownStartIndex >= 0) {
            drawdownDuration = trades.length - 1 - drawdownStartIndex;
            maxDrawdownDuration = Math.max(maxDrawdownDuration, drawdownDuration);
        }
        
        return {
            maxDrawdownPoints: maxDrawdownPoints,
            maxDrawdownPercent: maxDrawdownPercent,
            maxDrawdownDuration: maxDrawdownDuration
        };
    }
    
    // Update summary statistics display
    updateSummaryStats(stats) {
        this.lastStats = stats;
        
        let summaryDiv = document.getElementById('backtest-summary');
        if (!summaryDiv) {
            summaryDiv = this.createSummarySection();
        }
        
        summaryDiv.innerHTML = `
            <h3>Backtest Summary</h3>
            
            ${this.generateActiveRulesHTML()}
            
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
                    <div class="stat-label">Highest Win</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.maxLoss.toFixed(2)}</div>
                    <div class="stat-label">Highest Loss</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.profitFactor.toFixed(2)}</div>
                    <div class="stat-label">Profit Factor</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.calmarRatio.toFixed(2)}</div>
                    <div class="stat-label">Calmar Ratio</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.maxDrawdownPoints.toFixed(2)}</div>
                    <div class="stat-label">Max DD (Points)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.maxDrawdownPercent.toFixed(2)}%</div>
                    <div class="stat-label">Max DD (%)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.maxDrawdownDuration}</div>
                    <div class="stat-label">Max DD Duration</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.avgDuration.toFixed(1)}</div>
                    <div class="stat-label">Avg Duration</div>
                </div>
            </div>
            
            ${this.generateDetailedAnalysisHTML(stats)}
        `;
    }
    
    // Generate active rules display
    generateActiveRulesHTML() {
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
        
        // Add placeholder for other entry rules
        if (window.ruleConfig.entrySphAboveLph) {
            entryRules.push('✅ SPH above LPH Entry');
        }
        if (window.ruleConfig.reentryAboveHigh) {
            entryRules.push('✅ Re-entry above recent high');
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
        `;
    }
    
    // Generate detailed analysis HTML
    generateDetailedAnalysisHTML(stats) {
        return `
            <div class="detailed-analysis">
                <h4>Detailed Analysis</h4>
                
                <div class="analysis-grid">
                    <div class="analysis-section">
                        <h5>By Direction</h5>
                        <div class="analysis-stats">
                            <div class="analysis-item">
                                <span class="label">LONG Trades:</span>
                                <span class="value">${stats.longTrades.count} (${stats.longTrades.winRate.toFixed(1)}% win rate)</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">LONG Points:</span>
                                <span class="value">${stats.longTrades.totalPoints.toFixed(2)}</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">SHORT Trades:</span>
                                <span class="value">${stats.shortTrades.count} (${stats.shortTrades.winRate.toFixed(1)}% win rate)</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">SHORT Points:</span>
                                <span class="value">${stats.shortTrades.totalPoints.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>By Entry Rule</h5>
                        <div class="analysis-stats">
                            <div class="analysis-item">
                                <span class="label">LPH Entries:</span>
                                <span class="value">${stats.lphEntries}</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">LPL Entries:</span>
                                <span class="value">${stats.lplEntries}</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">Gap Entries:</span>
                                <span class="value">${stats.gapEntries}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>By Exit Rule</h5>
                        <div class="analysis-stats">
                            <div class="analysis-item">
                                <span class="label">Stop Loss Exits:</span>
                                <span class="value">${stats.stopLossExits}</span>
                            </div>
                            <div class="analysis-item">
                                <span class="label">EOD Exits:</span>
                                <span class="value">${stats.eodExits}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create summary section
    createSummarySection() {
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'backtest-summary';
        summaryDiv.className = 'backtest-summary';
        
        const controlsDiv = document.querySelector('.simple-backtest-controls');
        if (controlsDiv) {
            controlsDiv.parentNode.insertBefore(summaryDiv, controlsDiv.nextSibling);
        } else {
            document.body.appendChild(summaryDiv);
        }
        
        return summaryDiv;
    }
    
    // Show summary section
    showSummarySection() {
        const summaryDiv = document.getElementById('backtest-summary');
        if (summaryDiv) summaryDiv.style.display = 'block';
    }
    
    // Clear summary
    clearSummary() {
        const summaryDiv = document.getElementById('backtest-summary');
        if (summaryDiv) summaryDiv.style.display = 'none';
        this.lastStats = null;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ResultsSummary = ResultsSummary;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsSummary;
}
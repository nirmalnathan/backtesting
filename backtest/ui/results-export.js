// backtest/ui/results-export.js
// Export functionality for results

class ResultsExport {
    constructor() {
        this.lastResults = null;
        this.lastStats = null;
    }
    
    // Set results data for export
    setResultsData(trades, stats) {
        this.lastResults = trades;
        this.lastStats = stats;
    }
    
    // Export results data
    exportResults() {
        if (!this.lastResults) {
            alert('No results to export');
            return null;
        }
        
        return {
            trades: this.lastResults,
            statistics: this.lastStats,
            configuration: window.ruleConfig,
            exportTime: new Date().toISOString()
        };
    }
    
    // Export to JSON
    exportToJSON() {
        const data = this.exportResults();
        if (!data) return;
        
        const jsonString = JSON.stringify(data, null, 2);
        this.downloadFile(jsonString, 'application/json', 'json');
    }
    
    // Export to CSV (trades only)
    exportToCSV() {
        if (!this.lastResults) {
            alert('No trade data to export');
            return;
        }
        
        const csvData = this.convertTradesToCSV(this.lastResults);
        this.downloadFile(csvData, 'text/csv', 'csv');
    }
    
    // Export summary statistics
    exportSummaryStats() {
        if (!this.lastStats) {
            alert('No statistics to export');
            return;
        }
        
        const csvData = this.convertStatsToCSV(this.lastStats);
        this.downloadFile(csvData, 'text/csv', 'csv', 'summary-stats');
    }
    
    // Export detailed report
    exportDetailedReport() {
        const data = this.exportResults();
        if (!data) return;
        
        const report = this.generateDetailedReport(data);
        this.downloadFile(report, 'text/plain', 'txt', 'detailed-report');
    }
    
    // Convert trades to CSV format
    convertTradesToCSV(trades) {
        const headers = [
            'Trade #', 'Direction', 'Entry Time', 'Exit Time',
            'Entry Price', 'Exit Price', 'Points', 'Duration (bars)',
            'Entry Rule', 'Exit Rule', 'Result', 'Win/Loss'
        ];
        
        let csv = headers.join(',') + '\n';
        
        trades.forEach(trade => {
            const row = [
                trade.tradeId,
                trade.direction,
                new Date(trade.entryTime).toISOString(),
                new Date(trade.exitTime).toISOString(),
                trade.entryPrice.toFixed(2),
                trade.exitPrice.toFixed(2),
                trade.points.toFixed(2),
                trade.duration,
                `"${trade.entryRule}"`,
                `"${trade.exitRule}"`,
                trade.isWin ? 'WIN' : 'LOSS',
                trade.points.toFixed(2)
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }
    
    // Convert statistics to CSV format
    convertStatsToCSV(stats) {
        const statsData = [
            ['Metric', 'Value'],
            ['Total Trades', stats.totalTrades],
            ['Winning Trades', stats.winningTrades],
            ['Losing Trades', stats.losingTrades],
            ['Win Rate (%)', stats.winRate.toFixed(2)],
            ['Total Points', stats.totalPoints.toFixed(2)],
            ['Average Points per Trade', stats.avgPoints.toFixed(2)],
            ['Average Winning Points', stats.avgWinPoints.toFixed(2)],
            ['Average Losing Points', stats.avgLossPoints.toFixed(2)],
            ['Maximum Win', stats.maxWin.toFixed(2)],
            ['Maximum Loss', stats.maxLoss.toFixed(2)],
            ['Profit Factor', stats.profitFactor.toFixed(2)],
            ['Calmar Ratio', stats.calmarRatio.toFixed(2)],
            ['Max Drawdown (Points)', stats.maxDrawdownPoints.toFixed(2)],
            ['Max Drawdown (%)', stats.maxDrawdownPercent.toFixed(2)],
            ['Max Drawdown Duration', stats.maxDrawdownDuration],
            ['Average Duration', stats.avgDuration.toFixed(1)],
            ['', ''],
            ['Direction Analysis', ''],
            ['Long Trades Count', stats.longTrades.count],
            ['Long Trades Win Rate (%)', stats.longTrades.winRate.toFixed(2)],
            ['Long Trades Total Points', stats.longTrades.totalPoints.toFixed(2)],
            ['Short Trades Count', stats.shortTrades.count],
            ['Short Trades Win Rate (%)', stats.shortTrades.winRate.toFixed(2)],
            ['Short Trades Total Points', stats.shortTrades.totalPoints.toFixed(2)],
            ['', ''],
            ['Entry Rule Analysis', ''],
            ['LPH Entries', stats.lphEntries],
            ['LPL Entries', stats.lplEntries],
            ['Gap Entries', stats.gapEntries],
            ['', ''],
            ['Exit Rule Analysis', ''],
            ['Stop Loss Exits', stats.stopLossExits],
            ['EOD Exits', stats.eodExits]
        ];
        
        return statsData.map(row => row.join(',')).join('\n');
    }
    
    // Generate detailed text report
    generateDetailedReport(data) {
        const { trades, statistics: stats, configuration, exportTime } = data;
        
        let report = `BACKTEST DETAILED REPORT
Generated: ${new Date(exportTime).toLocaleString()}
=================================================

SUMMARY STATISTICS
-----------------
Total Trades: ${stats.totalTrades}
Winning Trades: ${stats.winningTrades} (${stats.winRate.toFixed(2)}%)
Losing Trades: ${stats.losingTrades} (${(100 - stats.winRate).toFixed(2)}%)

PERFORMANCE METRICS
------------------
Total Points: ${stats.totalPoints.toFixed(2)}
Average Points per Trade: ${stats.avgPoints.toFixed(2)}
Average Winning Points: ${stats.avgWinPoints.toFixed(2)}
Average Losing Points: ${stats.avgLossPoints.toFixed(2)}
Maximum Win: ${stats.maxWin.toFixed(2)}
Maximum Loss: ${stats.maxLoss.toFixed(2)}
Profit Factor: ${stats.profitFactor.toFixed(2)}

RISK METRICS
-----------
Maximum Drawdown (Points): ${stats.maxDrawdownPoints.toFixed(2)}
Maximum Drawdown (%): ${stats.maxDrawdownPercent.toFixed(2)}%
Maximum Drawdown Duration: ${stats.maxDrawdownDuration} trades
Calmar Ratio: ${stats.calmarRatio.toFixed(2)}

DIRECTIONAL ANALYSIS
-------------------
LONG Trades: ${stats.longTrades.count} (${stats.longTrades.winRate.toFixed(2)}% win rate)
LONG Total Points: ${stats.longTrades.totalPoints.toFixed(2)}

SHORT Trades: ${stats.shortTrades.count} (${stats.shortTrades.winRate.toFixed(2)}% win rate)
SHORT Total Points: ${stats.shortTrades.totalPoints.toFixed(2)}

RULE ANALYSIS
------------
Entry Rules:
- LPH Entries: ${stats.lphEntries}
- LPL Entries: ${stats.lplEntries}
- Gap Entries: ${stats.gapEntries}

Exit Rules:
- Stop Loss Exits: ${stats.stopLossExits}
- EOD Exits: ${stats.eodExits}

CONFIGURATION
------------
Entry LPH/LPL: ${configuration.entryLphLpl ? 'ENABLED' : 'DISABLED'}
Stop Loss: ${configuration.stopLoss ? 'ENABLED' : 'DISABLED'} ${configuration.stopLoss ? `(${configuration.stopLossPercent}%)` : ''}
EOD Exit: ${configuration.eodExit ? 'ENABLED' : 'DISABLED'}
Gap Handling: ${configuration.gapHandling ? 'ENABLED' : 'DISABLED'}
Daily Reset: ${configuration.dailyReset ? 'ENABLED' : 'DISABLED'}

TRADE DETAILS
=============
`;
        
        trades.forEach((trade, index) => {
            report += `
Trade ${trade.tradeId}: ${trade.direction} ${trade.isWin ? 'WIN' : 'LOSS'}
Entry: ${new Date(trade.entryTime).toLocaleString()} @ ${trade.entryPrice.toFixed(2)}
Exit:  ${new Date(trade.exitTime).toLocaleString()} @ ${trade.exitPrice.toFixed(2)}
Points: ${trade.points.toFixed(2)} | Duration: ${trade.duration} bars
Entry Rule: ${trade.entryRule}
Exit Rule: ${trade.exitRule}
${index < trades.length - 1 ? '---' : ''}`;
        });
        
        return report;
    }
    
    // Download file helper
    downloadFile(content, mimeType, extension, prefix = 'backtest-results') {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${prefix}-${timestamp}.${extension}`;
        
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    // Create export buttons
    createExportButtons() {
        const exportDiv = document.createElement('div');
        exportDiv.id = 'export-buttons';
        exportDiv.className = 'export-buttons';
        
        exportDiv.innerHTML = `
            <h4>Export Results</h4>
            <div class="export-button-group">
                <button onclick="window.resultsExport.exportToJSON()">Export JSON</button>
                <button onclick="window.resultsExport.exportToCSV()">Export Trades CSV</button>
                <button onclick="window.resultsExport.exportSummaryStats()">Export Stats CSV</button>
                <button onclick="window.resultsExport.exportDetailedReport()">Export Report</button>
            </div>
        `;
        
        const chartsContainer = document.getElementById('charts-container');
        if (chartsContainer) {
            chartsContainer.parentNode.insertBefore(exportDiv, chartsContainer.nextSibling);
        } else {
            const tableDiv = document.getElementById('trades-table-container');
            if (tableDiv) {
                tableDiv.parentNode.insertBefore(exportDiv, tableDiv.nextSibling);
            } else {
                document.body.appendChild(exportDiv);
            }
        }
        
        return exportDiv;
    }
    
    // Show export buttons
    showExportButtons() {
        let exportDiv = document.getElementById('export-buttons');
        if (!exportDiv) {
            exportDiv = this.createExportButtons();
        }
        exportDiv.style.display = 'block';
    }
    
    // Clear export section
    clearExport() {
        const exportDiv = document.getElementById('export-buttons');
        if (exportDiv) exportDiv.style.display = 'none';
        this.lastResults = null;
        this.lastStats = null;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ResultsExport = ResultsExport;
    window.resultsExport = new ResultsExport(); // Global instance
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsExport;
}
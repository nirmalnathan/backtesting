// backtest/ui/results-display.js
// Main results display orchestrator

class ResultsDisplay {
    constructor() {
        this.lastResults = null;
        this.summary = new ResultsSummary();
        this.table = new ResultsTable();
        this.charts = new ResultsCharts();
        this.export = new ResultsExport();
    }
    
    // Main display function
    displayResults(trades) {
        console.log('=== DISPLAYING ENHANCED BACKTEST RESULTS ===');
        
        if (!trades || trades.length === 0) {
            this.showStatus('No trades generated in backtest', 'info');
            return;
        }
        
        this.lastResults = trades;
        
        // Calculate comprehensive statistics
        const stats = this.summary.calculateEnhancedStats(trades);
        
        // Update all display components
        this.summary.updateSummaryStats(stats);
        this.table.updateTradesTable(trades);
        this.charts.displayCharts(trades, stats);
        this.export.setResultsData(trades, stats);
        
        // Show all sections
        this.showResultsSection();
        
        this.showStatus(`Backtest completed: ${trades.length} trades, ${stats.totalPoints.toFixed(2)} points`, 'success');
    }
    
    // Delegate methods to component classes for backward compatibility
    calculateEnhancedStats(trades) {
        return this.summary.calculateEnhancedStats(trades);
    }
    
    // Show results sections
    showResultsSection() {
        this.summary.showSummarySection();
        this.table.showTableSection();
        this.charts.showCharts();
        this.export.showExportButtons();
    }
    
    // Show status message
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.className = `status ${type}`;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
        } else {
            console.log(`Status (${type}): ${message}`);
        }
    }
    
    // Clear all results
    clearResults() {
        this.summary.clearSummary();
        this.table.clearTable();
        this.charts.clearCharts();
        this.export.clearExport();
        
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.style.display = 'none';
        
        this.lastResults = null;
        console.log('Results display cleared');
    }
    
    // Export results data (delegate to export component)
    exportResults() {
        return this.export.exportResults();
    }
}

// Global functions for compatibility
function displayBacktestResults(trades) {
    const resultsDisplay = new ResultsDisplay();
    resultsDisplay.displayResults(trades);
}

// Maintain compatibility with existing simple results
function displaySimpleResults(trades) {
    displayBacktestResults(trades);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ResultsDisplay = ResultsDisplay;
    window.displayBacktestResults = displayBacktestResults;
    window.displaySimpleResults = displaySimpleResults;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResultsDisplay, displayBacktestResults, displaySimpleResults };
}
// backtest/ui/results-table.js
// Trade table display functionality

class ResultsTable {
    constructor() {
        this.lastTrades = null;
    }
    
    // Update trades table
    updateTradesTable(trades) {
        this.lastTrades = trades;
        
        let tableDiv = document.getElementById('trades-table-container');
        if (!tableDiv) {
            tableDiv = this.createTableSection();
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
    
    // Create table section
    createTableSection() {
        const tableDiv = document.createElement('div');
        tableDiv.id = 'trades-table-container';
        tableDiv.className = 'trades-table-container';
        
        const summaryDiv = document.getElementById('backtest-summary');
        if (summaryDiv) {
            summaryDiv.parentNode.insertBefore(tableDiv, summaryDiv.nextSibling);
        } else {
            document.body.appendChild(tableDiv);
        }
        
        return tableDiv;
    }
    
    // Show table section
    showTableSection() {
        const tableDiv = document.getElementById('trades-table-container');
        if (tableDiv) tableDiv.style.display = 'block';
    }
    
    // Clear table
    clearTable() {
        const tableDiv = document.getElementById('trades-table-container');
        if (tableDiv) tableDiv.style.display = 'none';
        this.lastTrades = null;
    }
    
    // Filter table by direction
    filterByDirection(direction) {
        if (!this.lastTrades) return;
        
        const filteredTrades = direction === 'ALL' ? 
            this.lastTrades : 
            this.lastTrades.filter(trade => trade.direction === direction);
        
        this.updateTradesTable(filteredTrades);
    }
    
    // Filter table by result
    filterByResult(result) {
        if (!this.lastTrades) return;
        
        let filteredTrades;
        if (result === 'ALL') {
            filteredTrades = this.lastTrades;
        } else if (result === 'WIN') {
            filteredTrades = this.lastTrades.filter(trade => trade.isWin);
        } else if (result === 'LOSS') {
            filteredTrades = this.lastTrades.filter(trade => !trade.isWin);
        }
        
        this.updateTradesTable(filteredTrades);
    }
    
    // Sort table by column
    sortByColumn(column, ascending = true) {
        if (!this.lastTrades) return;
        
        const sortedTrades = [...this.lastTrades].sort((a, b) => {
            let aVal, bVal;
            
            switch (column) {
                case 'points':
                    aVal = a.points;
                    bVal = b.points;
                    break;
                case 'duration':
                    aVal = a.duration;
                    bVal = b.duration;
                    break;
                case 'entryTime':
                    aVal = new Date(a.entryTime);
                    bVal = new Date(b.entryTime);
                    break;
                case 'exitTime':
                    aVal = new Date(a.exitTime);
                    bVal = new Date(b.exitTime);
                    break;
                case 'entryPrice':
                    aVal = a.entryPrice;
                    bVal = b.entryPrice;
                    break;
                case 'exitPrice':
                    aVal = a.exitPrice;
                    bVal = b.exitPrice;
                    break;
                default:
                    aVal = a[column];
                    bVal = b[column];
            }
            
            if (ascending) {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
        
        this.updateTradesTable(sortedTrades);
    }
    
    // Export table data
    exportTableData() {
        if (!this.lastTrades) {
            return null;
        }
        
        const csvData = this.convertToCSV(this.lastTrades);
        return csvData;
    }
    
    // Convert trades to CSV format
    convertToCSV(trades) {
        const headers = [
            'Trade #', 'Direction', 'Entry Time', 'Exit Time',
            'Entry Price', 'Exit Price', 'Points', 'Duration',
            'Entry Rule', 'Exit Rule', 'Result'
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
                trade.isWin ? 'WIN' : 'LOSS'
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }
    
    // Download table as CSV
    downloadCSV() {
        const csvData = this.exportTableData();
        if (!csvData) {
            alert('No trade data to export');
            return;
        }
        
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backtest-trades-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ResultsTable = ResultsTable;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsTable;
}
// utils/debug-logger.js
// Simple file-based logging system for debugging

class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Prevent memory issues
        this.isEnabled = true;
    }
    
    // Log with timestamp and category
    log(category, message, data = null) {
        if (!this.isEnabled) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            category,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : null
        };
        
        this.logs.push(logEntry);
        
        // Keep only recent logs to prevent memory issues
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Also output to console for immediate viewing
        console.log(`[${category}] ${message}`, data || '');
    }
    
    // Specific logging methods for different categories
    pivot(message, data = null) {
        this.log('PIVOT', message, data);
    }
    
    trade(message, data = null) {
        this.log('TRADE', message, data);
    }
    
    rule(message, data = null) {
        this.log('RULE', message, data);
    }
    
    entry(message, data = null) {
        this.log('ENTRY', message, data);
    }
    
    exit(message, data = null) {
        this.log('EXIT', message, data);
    }
    
    error(message, data = null) {
        this.log('ERROR', message, data);
    }
    
    // Export logs to downloadable file
    exportToFile(filename = 'debug-log.txt') {
        const logText = this.logs.map(entry => {
            const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
            return `${entry.timestamp} [${entry.category}] ${entry.message}${dataStr}`;
        }).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${this.logs.length} log entries to ${filename}`);
    }
    
    // Clear all logs
    clear() {
        this.logs = [];
        console.log('Debug logs cleared');
    }
    
    // Enable/disable logging
    enable() {
        this.isEnabled = true;
    }
    
    disable() {
        this.isEnabled = false;
    }
    
    // Get logs for specific category
    getByCategory(category) {
        return this.logs.filter(log => log.category === category);
    }
    
    // Get recent logs (last N entries)
    getRecent(count = 50) {
        return this.logs.slice(-count);
    }
}

// Create global logger instance
if (typeof window !== 'undefined') {
    window.debugLogger = new DebugLogger();
    
    // Add export button to UI (if not already present)
    if (!document.getElementById('export-logs-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-logs-btn';
        exportBtn.textContent = 'Export Debug Logs';
        exportBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            padding: 5px 10px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        `;
        exportBtn.onclick = () => window.debugLogger.exportToFile();
        document.body.appendChild(exportBtn);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebugLogger };
}
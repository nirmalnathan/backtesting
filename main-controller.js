// main-controller.js
// Main application controller and file processing

// Global variables
let rawData = [];
window.chartData = [];
window.pivotData = { sph: [], spl: [], lph: [], lpl: [] };

// Update statistics
function updateStats(data, pivots) {
    document.getElementById('sphCount').textContent = pivots.sph.length;
    document.getElementById('splCount').textContent = pivots.spl.length;
    document.getElementById('lphCount').textContent = pivots.lph.length;
    document.getElementById('lplCount').textContent = pivots.lpl.length;
    document.getElementById('totalBars').textContent = data.length;
    document.getElementById('pivotStats').style.display = 'grid';
}

// Process uploaded file
function processFileInternal() {
    const fileInput = document.getElementById('csvFile');
    const timeframe = parseInt(document.getElementById('timeframe').value);
    const statusDiv = document.getElementById('status');
    
    if (!fileInput.files[0]) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please select a CSV file first.';
        statusDiv.style.display = 'block';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse raw data
            rawData = parseCSV(e.target.result);
            
            if (rawData.length === 0) {
                throw new Error('No valid data found in CSV file');
            }
            
            // Convert to selected timeframe
            window.chartData = convertToTimeframe(rawData, timeframe);
            
            if (window.chartData.length < 3) {
                throw new Error('Not enough data after timeframe conversion. Need at least 3 bars.');
            }
            
            // Detect pivots
            window.pivotData = detectPivots(window.chartData);
            
            // Update timeframe info
            const timeframeName = document.getElementById('timeframe').selectedOptions[0].text;
            document.getElementById('timeframeInfo').textContent = 
                `Converted ${rawData.length} ticks to ${window.chartData.length} ${timeframeName} bars`;
            
            // Reset zoom and draw
            if (window.resetZoomFunction) {
                window.resetZoomFunction();
            }
            drawChart(window.chartData, window.pivotData);
            updateStats(window.chartData, window.pivotData);
            
            statusDiv.className = 'status success';
            statusDiv.textContent = `Successfully processed ${window.chartData.length} bars (${timeframeName}) with ${window.pivotData.sph.length + window.pivotData.spl.length + window.pivotData.lph.length + window.pivotData.lpl.length} pivot points detected.`;
            statusDiv.style.display = 'block';
            
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `Error processing file: ${error.message}`;
            statusDiv.style.display = 'block';
            console.error('Processing error:', error);
        }
    };
    
    reader.readAsText(fileInput.files[0]);
}

// Expose function globally
window.processFileFunction = processFileInternal;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    setupChartEventListeners();
    if (window.fitToScreenFunction) {
        window.fitToScreenFunction();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        setTimeout(() => {
            if (window.fitToScreenFunction) {
                window.fitToScreenFunction();
            }
        }, 100);
    });
    
    console.log('NIFTY Pivot Detector initialized');
});
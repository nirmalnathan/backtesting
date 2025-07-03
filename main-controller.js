// main-controller.js
// FIXED: Proper data validation and error handling

// Global variables
let rawData = [];
window.chartData = [];
window.pivotData = { sph: [], spl: [], lph: [], lpl: [] };
let barsFormed = false;

// Update statistics
function updateStats(data, pivots) {
    document.getElementById('sphCount').textContent = pivots.sph.length;
    document.getElementById('splCount').textContent = pivots.spl.length;
    document.getElementById('lphCount').textContent = pivots.lph.length;
    document.getElementById('lplCount').textContent = pivots.lpl.length;
    document.getElementById('totalBars').textContent = data.length;
    document.getElementById('pivotStats').style.display = 'grid';
}

// Process uploaded file and form bars
function formBarsInternal() {
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
            
            // Clear any existing pivots
            window.pivotData = { sph: [], spl: [], lph: [], lpl: [] };
            barsFormed = true;
            
            // Update timeframe info
            const timeframeName = document.getElementById('timeframe').selectedOptions[0].text;
            document.getElementById('timeframeInfo').textContent = 
                `Converted ${rawData.length} ticks to ${window.chartData.length} ${timeframeName} bars`;
            
            // Enable pivot detection button
            const detectBtn = document.getElementById('detectPivotsBtn');
            if (detectBtn) {
                detectBtn.disabled = false;
            }
            
            // Reset zoom and draw chart with bars only
            if (window.resetZoomFunction) {
                window.resetZoomFunction();
            }
            drawChart(window.chartData, window.pivotData);
            updateStats(window.chartData, window.pivotData);
            
            statusDiv.className = 'status success';
            statusDiv.textContent = `Successfully formed ${window.chartData.length} bars (${timeframeName}). Ready for pivot detection.`;
            statusDiv.style.display = 'block';
            
            console.log('Bars formed successfully:', window.chartData.length, 'bars');
            
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `Error forming bars: ${error.message}`;
            statusDiv.style.display = 'block';
            console.error('Bar formation error:', error);
            barsFormed = false;
            const detectBtn = document.getElementById('detectPivotsBtn');
            if (detectBtn) {
                detectBtn.disabled = true;
            }
        }
    };
    
    reader.readAsText(fileInput.files[0]);
}

// FIXED: Detect pivots with proper validation
function detectPivotsInternal() {
    const statusDiv = document.getElementById('status');
    
    console.log('detectPivotsInternal called');
    console.log('barsFormed:', barsFormed);
    console.log('window.chartData:', window.chartData);
    console.log('window.chartData type:', typeof window.chartData);
    console.log('window.chartData.length:', window.chartData ? window.chartData.length : 'undefined');
    
    // FIXED: Comprehensive validation
    if (!barsFormed) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please form bars first by clicking "Form Bars" button.';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (!window.chartData) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'No chart data available. Please form bars first.';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (!Array.isArray(window.chartData)) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Invalid chart data format. Please form bars again.';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (window.chartData.length < 3) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Not enough bars for pivot detection. Need at least 3 bars.';
        statusDiv.style.display = 'block';
        return;
    }
    
    try {
        statusDiv.className = 'status info';
        statusDiv.textContent = 'Detecting pivots...';
        statusDiv.style.display = 'block';
        
        console.log('About to call detectPivots with valid data:', window.chartData.length, 'bars');
        
        // FIXED: Call detectPivots with proper error handling
        window.pivotData = detectPivots(window.chartData);
        
        // Redraw chart with pivots
        drawChart(window.chartData, window.pivotData);
        updateStats(window.chartData, window.pivotData);
        
        const totalPivots = window.pivotData.sph.length + window.pivotData.spl.length + 
                           window.pivotData.lph.length + window.pivotData.lpl.length;
        
        statusDiv.className = 'status success';
        statusDiv.textContent = `Successfully detected ${totalPivots} pivot points (SPH: ${window.pivotData.sph.length}, SPL: ${window.pivotData.spl.length}, LPH: ${window.pivotData.lph.length}, LPL: ${window.pivotData.lpl.length}).`;
        statusDiv.style.display = 'block';
        
        console.log('Pivot detection completed successfully');
        
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Error detecting pivots: ${error.message}`;
        statusDiv.style.display = 'block';
        console.error('Pivot detection error:', error);
    }
}

// Get bar data at specific canvas coordinates
function getBarAtPosition(x, y) {
    if (!window.chartData || window.chartData.length === 0) return null;
    
    const canvas = document.getElementById('chart');
    const hZoom = parseFloat(document.getElementById('hZoom').value);
    
    // Chart dimensions
    const margin = { top: 30, right: 20, bottom: 80, left: 80 };
    const chartWidth = canvas.width - margin.left - margin.right;
    
    // Calculate bar width with zoom
    const barWidth = Math.max(2, (chartWidth / window.chartData.length) * hZoom);
    
    // Adjust for panning
    const adjustedX = x - window.panX - margin.left;
    
    // Calculate bar index
    const barIndex = Math.floor(adjustedX / barWidth);
    
    if (barIndex >= 0 && barIndex < window.chartData.length) {
        return {
            index: barIndex,
            data: window.chartData[barIndex]
        };
    }
    
    return null;
}

// Show tooltip with OHLC data
function showTooltip(x, y, barData) {
    let tooltip = document.getElementById('chartTooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chartTooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
        `;
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = `
        <div><strong>Bar ${barData.index}</strong></div>
        <div>Open: ${barData.data.open.toFixed(2)}</div>
        <div>High: ${barData.data.high.toFixed(2)}</div>
        <div>Low: ${barData.data.low.toFixed(2)}</div>
        <div>Close: ${barData.data.close.toFixed(2)}</div>
        <div>Time: ${new Date(barData.data.timestamp).toLocaleString()}</div>
    `;
    
    // Position tooltip
    tooltip.style.left = (x + 10) + 'px';
    tooltip.style.top = (y - 10) + 'px';
    tooltip.style.display = 'block';
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('chartTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Setup chart mouse events for tooltips
function setupChartTooltips() {
    const canvas = document.getElementById('chart');
    
    canvas.addEventListener('mousemove', function(e) {
        if (!window.isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const barData = getBarAtPosition(x, y);
            
            if (barData) {
                showTooltip(e.clientX, e.clientY, barData);
            } else {
                hideTooltip();
            }
        }
    });
    
    canvas.addEventListener('mouseleave', function() {
        hideTooltip();
    });
}

// Expose functions globally
window.formBarsFunction = formBarsInternal;
window.detectPivotsFunction = detectPivotsInternal;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing NIFTY Pivot Detector...');
    
    setupChartEventListeners();
    setupChartTooltips();
    
    // Initially disable pivot detection button
    const detectBtn = document.getElementById('detectPivotsBtn');
    if (detectBtn) {
        detectBtn.disabled = true;
        console.log('Pivot detection button disabled initially');
    }
    
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
    
    console.log('NIFTY Pivot Detector initialized with separate processes');
});
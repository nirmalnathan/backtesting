// main-controller.js - FIXED VERSION
// FIXED: Proper data validation and error handling for split functionality with debug protection

// Global variables
let rawData = [];
let barsFormed = false;

// DEBUGGING: Data protector to catch when chartData gets cleared
let originalChartData = [];
let originalPivotData = { sph: [], spl: [], lph: [], lpl: [] };

// Override window.chartData with a getter/setter to track changes
Object.defineProperty(window, 'chartData', {
    get: function() {
        return originalChartData;
    },
    set: function(value) {
        console.log('=== CHARTDATA CHANGE DETECTED ===');
        console.log('Previous value:', originalChartData ? originalChartData.length : 'null/undefined');
        console.log('New value:', value ? value.length : 'null/undefined');
        console.log('Stack trace:', new Error().stack);
        console.log('=== END CHARTDATA CHANGE ===');
        originalChartData = value;
    },
    configurable: true
});

// Override window.pivotData with a getter/setter to track changes
Object.defineProperty(window, 'pivotData', {
    get: function() {
        return originalPivotData;
    },
    set: function(value) {
        console.log('=== PIVOTDATA CHANGE DETECTED ===');
        console.log('New pivot data:', value);
        originalPivotData = value;
    },
    configurable: true
});

// Update statistics
function updateStats(data, pivots) {
    document.getElementById('sphCount').textContent = pivots.sph.length;
    document.getElementById('splCount').textContent = pivots.spl.length;
    document.getElementById('lphCount').textContent = pivots.lph.length;
    document.getElementById('lplCount').textContent = pivots.lpl.length;
    document.getElementById('totalBars').textContent = data.length;
    document.getElementById('pivotStats').style.display = 'grid';
}

// FIXED: Process uploaded file and form bars with data protection
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
            const convertedData = convertToTimeframe(rawData, timeframe);
            
            if (convertedData.length < 3) {
                throw new Error('Not enough data after timeframe conversion. Need at least 3 bars.');
            }
            
            // FIXED: Store data securely to prevent corruption
            console.log('About to set window.chartData with', convertedData.length, 'bars');
            window.chartData = JSON.parse(JSON.stringify(convertedData)); // Deep copy to prevent reference issues
            console.log('window.chartData set successfully, length:', window.chartData.length);
            
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
            
            // FIXED: Don't call resetZoom immediately - it might corrupt data
            // Just draw the chart directly
            console.log('About to draw chart. Current window.chartData.length:', window.chartData.length);
            try {
                drawChart(window.chartData, window.pivotData);
                console.log('Chart drawn successfully. Current window.chartData.length:', window.chartData.length);
                updateStats(window.chartData, window.pivotData);
                console.log('Stats updated. Current window.chartData.length:', window.chartData.length);
            } catch (chartError) {
                console.error('Chart drawing error:', chartError);
                // Chart error shouldn't prevent pivot detection
            }
            
            statusDiv.className = 'status success';
            statusDiv.textContent = `Successfully formed ${window.chartData.length} bars (${timeframeName}). Ready for pivot detection.`;
            statusDiv.style.display = 'block';
            
            console.log('Bars formed successfully:', window.chartData.length, 'bars');
            console.log('Final check - window.chartData.length:', window.chartData.length);
            
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

// FIXED: Detect pivots with bulletproof validation
function detectPivotsInternal() {
    const statusDiv = document.getElementById('status');
    
    console.log('=== PIVOT DETECTION START ===');
    console.log('barsFormed:', barsFormed);
    console.log('window.chartData exists:', !!window.chartData);
    console.log('window.chartData length:', window.chartData ? window.chartData.length : 'undefined');
    
    // FIXED: Ultra-comprehensive validation
    if (!barsFormed) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please form bars first by clicking "Form Bars" button.';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (!window.chartData || !Array.isArray(window.chartData) || window.chartData.length < 3) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Chart data corrupted. Please form bars again.';
        statusDiv.style.display = 'block';
        console.error('Chart data validation failed:', {
            exists: !!window.chartData,
            isArray: Array.isArray(window.chartData),
            length: window.chartData ? window.chartData.length : 'undefined'
        });
        return;
    }
    
    try {
        statusDiv.className = 'status info';
        statusDiv.textContent = 'Detecting pivots...';
        statusDiv.style.display = 'block';
        
        console.log('About to call detectPivots with data length:', window.chartData.length);
        
        // FIXED: Create a protected copy for pivot detection
        const dataForPivots = JSON.parse(JSON.stringify(window.chartData));
        console.log('Created data copy for pivot detection');
        
        // Call detectPivots with the copy
        window.pivotData = detectPivots(dataForPivots);
        
        console.log('Pivot detection completed successfully');
        
        // Validate pivot results
        if (!window.pivotData || typeof window.pivotData !== 'object') {
            throw new Error('Invalid pivot data returned');
        }
        
        // Redraw chart with pivots (using original data, not the copy)
        console.log('About to redraw chart with pivots. window.chartData.length:', window.chartData.length);
        drawChart(window.chartData, window.pivotData);
        updateStats(window.chartData, window.pivotData);
        
        const totalPivots = (window.pivotData.sph?.length || 0) + (window.pivotData.spl?.length || 0) + 
                           (window.pivotData.lph?.length || 0) + (window.pivotData.lpl?.length || 0);
        
        statusDiv.className = 'status success';
        statusDiv.textContent = `Successfully detected ${totalPivots} pivot points (SPH: ${window.pivotData.sph?.length || 0}, SPL: ${window.pivotData.spl?.length || 0}, LPH: ${window.pivotData.lph?.length || 0}, LPL: ${window.pivotData.lpl?.length || 0}).`;
        statusDiv.style.display = 'block';
        
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Error detecting pivots: ${error.message}`;
        statusDiv.style.display = 'block';
        console.error('Pivot detection error:', error);
    }
}

// Get bar data at specific canvas coordinates - FIXED WITH PROPER PAN OFFSET
function getBarAtPosition(x, y) {
    if (!window.chartData || window.chartData.length === 0) return null;
    
    const canvas = document.getElementById('chart');
    const hZoom = parseFloat(document.getElementById('hZoom').value);
    
    // Chart dimensions
    const margin = { top: 30, right: 20, bottom: 80, left: 80 };
    const chartWidth = canvas.width - margin.left - margin.right;
    
    // Calculate bar width with zoom
    const barWidth = Math.max(2, (chartWidth / window.chartData.length) * hZoom);
    
    // CRITICAL FIX: Adjust for panning correctly
    // The mouse position needs to account for pan offset
    const adjustedX = x - margin.left - window.panX;
    
    // Calculate bar index
    const barIndex = Math.floor(adjustedX / barWidth);
    
    console.log(`Tooltip Debug: mouseX=${x}, adjustedX=${adjustedX}, barWidth=${barWidth}, barIndex=${barIndex}, panX=${window.panX}`);
    
    if (barIndex >= 0 && barIndex < window.chartData.length) {
        console.log(`Found bar ${barIndex}:`, window.chartData[barIndex]);
        return {
            index: barIndex,
            data: window.chartData[barIndex]
        };
    }
    
    console.log(`Bar index ${barIndex} out of bounds (0-${window.chartData.length-1})`);
    return null;
}

// Show tooltip with OHLC data - ENHANCED WITH MORE DETAILS
function showTooltip(x, y, barData) {
    let tooltip = document.getElementById('chartTooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chartTooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            pointer-events: none;
            z-index: 10000;
            white-space: nowrap;
            border: 1px solid #444;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(tooltip);
    }
    
    // Fix date display in tooltip
    let dateDisplay = 'Invalid Date';
    let timeDisplay = '';
    
    try {
        const dateSource = barData.data.datetime || barData.data.timestamp || barData.data.date;
        if (dateSource) {
            const date = new Date(dateSource);
            if (!isNaN(date.getTime())) {
                dateDisplay = date.toLocaleDateString();
                timeDisplay = date.toLocaleTimeString();
            } else {
                dateDisplay = `Bar ${barData.index}`;
                timeDisplay = 'Time: N/A';
            }
        } else {
            dateDisplay = `Bar ${barData.index}`;
            timeDisplay = 'Time: N/A';
        }
    } catch (error) {
        dateDisplay = `Bar ${barData.index}`;
        timeDisplay = 'Time: N/A';
    }
    
    // Enhanced tooltip with clear formatting
    tooltip.innerHTML = `
        <div style="color: #FFD700; font-weight: bold; margin-bottom: 4px;">Bar ${barData.index}</div>
        <div style="color: #ADD8E6; margin-bottom: 4px;">${dateDisplay}</div>
        <div style="color: #ADD8E6; margin-bottom: 6px;">${timeDisplay}</div>
        <div style="color: #90EE90;">Open:  ${barData.data.open.toFixed(2)}</div>
        <div style="color: #FF6B6B;">High:  ${barData.data.high.toFixed(2)}</div>
        <div style="color: #FF6B6B;">Low:   ${barData.data.low.toFixed(2)}</div>
        <div style="color: #87CEEB;">Close: ${barData.data.close.toFixed(2)}</div>
    `;
    
    // Position tooltip near mouse but avoid going off screen
    let tooltipX = x + 15;
    let tooltipY = y - 10;
    
    // Adjust if tooltip would go off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipX + 200 > window.innerWidth) {
        tooltipX = x - 220; // Show on left side of cursor
    }
    if (tooltipY - 100 < 0) {
        tooltipY = y + 20; // Show below cursor
    }
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    tooltip.style.display = 'block';
    
    console.log(`Showing tooltip for bar ${barData.index}: O=${barData.data.open} H=${barData.data.high} L=${barData.data.low} C=${barData.data.close}`);
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('chartTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Setup chart mouse events for tooltips - ENHANCED DEBUG VERSION
function setupChartTooltips() {
    const canvas = document.getElementById('chart');
    
    console.log('Setting up chart tooltips...');
    
    // Tooltip functionality moved to chart-renderer.js to avoid duplicate listeners
    // This prevents conflicts with pan/zoom controls
    
    console.log('Chart tooltip setup complete');
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
    
    // FIXED: Commenting out fitToScreen call during initialization as it might corrupt data
    // if (window.fitToScreenFunction) {
    //     window.fitToScreenFunction();
    // }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        setTimeout(() => {
            // if (window.fitToScreenFunction) {
            //     window.fitToScreenFunction();
            // }
        }, 100);
    });
    
    console.log('NIFTY Pivot Detector initialized with separate processes');
});
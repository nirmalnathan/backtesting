// chart-renderer.js
// Fixed chart renderer with proper event handling

let canvasWidth = 1200;
let canvasHeight = 700;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Expose pan variables globally for tooltip calculations
window.panX = panX;
window.panY = panY;
window.isDragging = isDragging;

// Update global pan variables when they change
function updateGlobalPanVars() {
    window.panX = panX;
    window.panY = panY;
    window.isDragging = isDragging;
}

// Draw chart
function drawChart(data, pivots) {
    const canvas = document.getElementById('chart');
    const container = document.getElementById('chartContainer');
    
    // Set canvas size
    canvas.width = Math.max(canvasWidth, container.clientWidth);
    canvas.height = Math.max(canvasHeight, container.clientHeight);
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) return;
    
    // Get zoom values
    const hZoom = parseFloat(document.getElementById('hZoom').value);
    const vScale = parseFloat(document.getElementById('vScale').value);
    
    // Calculate price range
    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const priceRange = (maxPrice - minPrice) / vScale;
    const centerPrice = (minPrice + maxPrice) / 2;
    const adjustedMinPrice = centerPrice - priceRange / 2;
    const adjustedMaxPrice = centerPrice + priceRange / 2;
    
    // Chart dimensions
    const margin = { top: 30, right: 20, bottom: 80, left: 80 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Calculate bar width with zoom
    const barWidth = Math.max(2, (chartWidth / data.length) * hZoom);
    const totalWidth = data.length * barWidth;
    
    // Apply panning
    ctx.save();
    ctx.translate(panX, panY);
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw price grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const gridLines = 10;
    for (let i = 0; i <= gridLines; i++) {
        const y = margin.top + (chartHeight * i / gridLines);
        const price = adjustedMaxPrice - (priceRange * i / gridLines);
        
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + Math.max(chartWidth, totalWidth), y);
        ctx.stroke();
        
        // Price labels
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(price.toFixed(1), margin.left - 5, y + 4);
    }
    
    // Draw time grid and labels
    const timeSteps = Math.max(1, Math.floor(data.length / 10));
    for (let i = 0; i < data.length; i += timeSteps) {
        const x = margin.left + (i * barWidth);
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + chartHeight);
        ctx.stroke();
        
        // Time labels
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        const date = new Date(data[i].timestamp);
        ctx.fillText(date.toLocaleDateString(), x, margin.top + chartHeight + 20);
    }
    
    // Draw candlesticks
    for (let i = 0; i < data.length; i++) {
        const bar = data[i];
        const x = margin.left + (i * barWidth);
        const openY = margin.top + ((adjustedMaxPrice - bar.open) / priceRange) * chartHeight;
        const closeY = margin.top + ((adjustedMaxPrice - bar.close) / priceRange) * chartHeight;
        const highY = margin.top + ((adjustedMaxPrice - bar.high) / priceRange) * chartHeight;
        const lowY = margin.top + ((adjustedMaxPrice - bar.low) / priceRange) * chartHeight;
        
        // Determine color
        const isGreen = bar.close > bar.open;
        ctx.fillStyle = isGreen ? '#4CAF50' : '#F44336';
        ctx.strokeStyle = isGreen ? '#4CAF50' : '#F44336';
        
        // Draw high-low line
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, highY);
        ctx.lineTo(x + barWidth / 2, lowY);
        ctx.stroke();
        
        // Draw body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY);
        ctx.fillRect(x + 1, bodyTop, Math.max(1, barWidth - 2), Math.max(1, bodyHeight));
    }
    
    // Draw pivots
    function drawPivot(pivotIndices, color, label, isHigh) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        pivotIndices.forEach(index => {
            if (index < data.length) {
                const bar = data[index];
                const x = margin.left + (index * barWidth) + barWidth / 2;
                const price = isHigh ? bar.high : bar.low;
                const y = margin.top + ((adjustedMaxPrice - price) / priceRange) * chartHeight;
                
                // Draw marker
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw label
                const labelY = isHigh ? y - 15 : y + 25;
                ctx.fillText(label, x, labelY);
                
                // Draw index number
                ctx.font = '10px Arial';
                ctx.fillText(index.toString(), x, isHigh ? y - 25 : y + 35);
                ctx.font = '12px Arial';
            }
        });
    }
    
    drawPivot(pivots.sph, '#ff6b6b', 'SPH', true);
    drawPivot(pivots.spl, '#4ecdc4', 'SPL', false);
    drawPivot(pivots.lph, '#ff4757', 'LPH', true);
    drawPivot(pivots.lpl, '#2ed573', 'LPL', false);
    
    ctx.restore();
}

// Setup event listeners for chart interaction
function setupChartEventListeners() {
    const canvas = document.getElementById('chart');
    const hZoom = document.getElementById('hZoom');
    const vScale = document.getElementById('vScale');
    
    // Zoom controls
    hZoom.addEventListener('input', function() {
        document.getElementById('hZoomValue').textContent = parseFloat(this.value).toFixed(1) + 'x';
        if (window.chartData && window.chartData.length > 0) {
            drawChart(window.chartData, window.pivotData);
        }
    });
    
    vScale.addEventListener('input', function() {
        document.getElementById('vScaleValue').textContent = parseFloat(this.value).toFixed(1) + 'x';
        if (window.chartData && window.chartData.length > 0) {
            drawChart(window.chartData, window.pivotData);
        }
    });
    
    // Mouse events for panning
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        updateGlobalPanVars();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            panX += deltaX;
            panY += deltaY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            updateGlobalPanVars();
            
            if (window.chartData && window.chartData.length > 0) {
                drawChart(window.chartData, window.pivotData);
            }
        }
    });
    
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
        updateGlobalPanVars();
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
        updateGlobalPanVars();
    });
    
    // FIXED: Wheel event with proper passive handling
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        if (e.ctrlKey) {
            // Vertical scaling
            const vScaleSlider = document.getElementById('vScale');
            let newValue = parseFloat(vScaleSlider.value) + (e.deltaY > 0 ? -0.1 : 0.1);
            newValue = Math.max(0.5, Math.min(3, newValue));
            vScaleSlider.value = newValue;
            document.getElementById('vScaleValue').textContent = newValue.toFixed(1) + 'x';
        } else {
            // Horizontal zooming
            const hZoomSlider = document.getElementById('hZoom');
            let newValue = parseFloat(hZoomSlider.value) + (e.deltaY > 0 ? -0.1 : 0.1);
            newValue = Math.max(0.1, Math.min(5, newValue));
            hZoomSlider.value = newValue;
            document.getElementById('hZoomValue').textContent = newValue.toFixed(1) + 'x';
        }
        
        if (window.chartData && window.chartData.length > 0) {
            drawChart(window.chartData, window.pivotData);
        }
    }, { passive: false }); // Explicitly mark as non-passive since we need preventDefault
}

// Reset zoom and pan
function resetZoomInternal() {
    panX = 0;
    panY = 0;
    document.getElementById('hZoom').value = 1;
    document.getElementById('vScale').value = 1;
    document.getElementById('hZoomValue').textContent = '1.0x';
    document.getElementById('vScaleValue').textContent = '1.0x';
    
    updateGlobalPanVars();
    
    if (window.chartData && window.chartData.length > 0) {
        drawChart(window.chartData, window.pivotData);
    }
}

// Fit chart to screen
function fitToScreenInternal() {
    const container = document.getElementById('chartContainer');
    const canvas = document.getElementById('chart');
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    resetZoomInternal();
}

// Expose functions globally
window.resetZoomFunction = resetZoomInternal;
window.fitToScreenFunction = fitToScreenInternal;
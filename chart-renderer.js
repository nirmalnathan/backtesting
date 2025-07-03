// chart-renderer.js
// Handles chart drawing and visualization

let canvasWidth = 1200;
let canvasHeight = 700;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
        
        ctx.strokeStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + chartHeight);
        ctx.stroke();
        
        // Time labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x, margin.top + chartHeight + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(formatTime(data[i].date), 0, 0);
        ctx.restore();
        
        // Date labels (less frequent)
        if (i % (timeSteps * 3) === 0) {
            ctx.fillText(formatDate(data[i].date), x, margin.top + chartHeight + 40);
        }
    }
    
    // Draw candlesticks
    data.forEach((candle, index) => {
        const x = margin.left + (index * barWidth);
        const openY = margin.top + ((adjustedMaxPrice - candle.open) / priceRange) * chartHeight;
        const closeY = margin.top + ((adjustedMaxPrice - candle.close) / priceRange) * chartHeight;
        const highY = margin.top + ((adjustedMaxPrice - candle.high) / priceRange) * chartHeight;
        const lowY = margin.top + ((adjustedMaxPrice - candle.low) / priceRange) * chartHeight;
        
        const isGreen = candle.close >= candle.open;
        ctx.strokeStyle = isGreen ? '#28a745' : '#dc3545';
        ctx.fillStyle = isGreen ? '#28a745' : '#dc3545';
        ctx.lineWidth = 1;
        
        // Draw high-low line
        ctx.beginPath();
        ctx.moveTo(x + barWidth/2, highY);
        ctx.lineTo(x + barWidth/2, lowY);
        ctx.stroke();
        
        // Draw body
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        const bodyWidth = Math.max(1, barWidth - 2);
        
        ctx.fillRect(x + 1, bodyY, bodyWidth, Math.max(1, bodyHeight));
    });
    
    // Draw pivot points
    function drawPivot(indices, color, label, isHigh = true) {
        indices.forEach(idx => {
            if (idx < data.length) {
                const x = margin.left + (idx * barWidth) + barWidth/2;
                const price = isHigh ? data[idx].high : data[idx].low;
                const y = margin.top + ((adjustedMaxPrice - price) / priceRange) * chartHeight;
                
                // Draw circle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Label
                ctx.fillStyle = color;
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(label, x, y + (isHigh ? -12 : 18));
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
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            panX += deltaX;
            panY += deltaY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            if (window.chartData && window.chartData.length > 0) {
                drawChart(window.chartData, window.pivotData);
            }
        }
    });
    
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });
    
    // Wheel event for zooming
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
    });
}

// Reset zoom and pan
function resetZoomInternal() {
    panX = 0;
    panY = 0;
    document.getElementById('hZoom').value = 1;
    document.getElementById('vScale').value = 1;
    document.getElementById('hZoomValue').textContent = '1.0x';
    document.getElementById('vScaleValue').textContent = '1.0x';
    
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
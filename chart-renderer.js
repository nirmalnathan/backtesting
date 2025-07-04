// chart-renderer.js - DEBUG VERSION with Crosshair and Arrow Navigation
// Fixed chart renderer with debug logging, crosshair tooltip, and keyboard navigation

let canvasWidth = 1200;
let canvasHeight = 700;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let showCrosshair = false;

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

// Draw chart with comprehensive debugging
function drawChart(data, pivots) {
    console.log('=== CHART RENDERER DEBUG ===');
    console.log('Data length:', data ? data.length : 'undefined');
    console.log('Pivots object:', pivots);
    
    if (pivots) {
        console.log('SPH array:', pivots.sph, 'Length:', pivots.sph ? pivots.sph.length : 'undefined');
        console.log('SPL array:', pivots.spl, 'Length:', pivots.spl ? pivots.spl.length : 'undefined');
        console.log('LPH array:', pivots.lph, 'Length:', pivots.lph ? pivots.lph.length : 'undefined');
        console.log('LPL array:', pivots.lpl, 'Length:', pivots.lpl ? pivots.lpl.length : 'undefined');
    } else {
        console.log('❌ PIVOTS IS NULL/UNDEFINED');
        return;
    }
    
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
    
    // Enhanced pivot drawing function with debug logs and offset positioning
    function drawPivot(pivotIndices, color, label, isHigh, isLargePivot = false) {
        console.log(`\n--- Drawing ${label} pivots ---`);
        console.log(`Color: ${color}, IsHigh: ${isHigh}, IsLarge: ${isLargePivot}`);
        console.log(`Pivot indices:`, pivotIndices);
        
        if (!pivotIndices || !Array.isArray(pivotIndices)) {
            console.log(`❌ ${label} indices is not a valid array:`, pivotIndices);
            return;
        }
        
        if (pivotIndices.length === 0) {
            console.log(`⚠️ ${label} array is empty`);
            return;
        }
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        let renderedCount = 0;
        
        pivotIndices.forEach((index, arrayIndex) => {
            console.log(`Processing ${label}[${arrayIndex}] = ${index}`);
            
            if (index < 0 || index >= data.length) {
                console.log(`❌ ${label} index ${index} is out of bounds (data length: ${data.length})`);
                return;
            }
            
            const bar = data[index];
            if (!bar) {
                console.log(`❌ No bar data found at index ${index}`);
                return;
            }
            
            const x = margin.left + (index * barWidth) + barWidth / 2;
            const price = isHigh ? bar.high : bar.low;
            let y = margin.top + ((adjustedMaxPrice - price) / priceRange) * chartHeight;
            
            // Apply offset for large pivots to avoid overlap
            if (isLargePivot) {
                if (isHigh) {
                    y -= 40; // Move LPH higher (above SPH)
                } else {
                    y += 40; // Move LPL lower (below SPL)
                }
            }
            
            console.log(`${label}[${index}] at (${x.toFixed(1)}, ${y.toFixed(1)}) price=${price.toFixed(2)} offset=${isLargePivot ? (isHigh ? '-20' : '+20') : '0'}`);
            
            // Draw marker with larger size for visibility
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw label with adjusted positioning
            const labelY = isHigh ? y - 15 : y + 25;
            ctx.fillText(label, x, labelY);
            
            // Draw index number with adjusted positioning
            ctx.font = '10px Arial';
            ctx.fillText(index.toString(), x, isHigh ? y - 25 : y + 35);
            ctx.font = '12px Arial';
            
            renderedCount++;
        });
        
        console.log(`✅ Successfully rendered ${renderedCount} ${label} pivots`);
    }
    
    // Draw all pivot types with debug info and proper spacing
    console.log('\n🔵 Starting pivot rendering...');
    
    drawPivot(pivots.sph || [], '#ff6b6b', 'SPH', true, false);   // Small pivot high - normal position
    drawPivot(pivots.spl || [], '#4ecdc4', 'SPL', false, false); // Small pivot low - normal position
    drawPivot(pivots.lph || [], '#0000ff', 'LPH', true, true);   // Large pivot high - offset higher
    drawPivot(pivots.lpl || [], '#ff00ff', 'LPL', false, true);  // Large pivot low - offset lower
    
    console.log('🔵 Finished pivot rendering');
    
    // Draw crosshair if mouse is over chart
    if (showCrosshair) {
        drawCrosshair(ctx, mouseX, mouseY, data, margin, barWidth, adjustedMaxPrice, priceRange, chartHeight);
    }
    
    console.log('=== END CHART RENDERER DEBUG ===\n');
    
    ctx.restore();
}

// Draw crosshair with X and Y axis values
function drawCrosshair(ctx, mouseX, mouseY, data, margin, barWidth, adjustedMaxPrice, priceRange, chartHeight) {
    const canvas = document.getElementById('chart');
    
    // Calculate chart bounds
    const chartLeft = margin.left;
    const chartRight = canvas.width - margin.right;
    const chartTop = margin.top;
    const chartBottom = margin.top + chartHeight;
    
    // Only draw if mouse is within chart area
    if (mouseX < chartLeft || mouseX > chartRight || mouseY < chartTop || mouseY > chartBottom) {
        return;
    }
    
    ctx.save();
    
    // Draw crosshair lines
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mouseX, chartTop);
    ctx.lineTo(mouseX, chartBottom);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(chartLeft, mouseY);
    ctx.lineTo(chartRight, mouseY);
    ctx.stroke();
    
    // Calculate values
    const barIndex = Math.floor((mouseX - margin.left) / barWidth);
    const price = adjustedMaxPrice - ((mouseY - margin.top) / chartHeight) * priceRange;
    
    // Draw value boxes
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '12px Arial';
    
    // Y-axis price label
    const priceText = price.toFixed(2);
    const priceWidth = ctx.measureText(priceText).width + 10;
    ctx.fillRect(chartLeft - priceWidth - 5, mouseY - 10, priceWidth, 20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(priceText, chartLeft - 5, mouseY + 4);
    
    // X-axis bar/time label
    let timeText = '';
    if (barIndex >= 0 && barIndex < data.length) {
        const bar = data[barIndex];
        const date = new Date(bar.timestamp);
        timeText = `Bar ${barIndex} - ${date.toLocaleDateString()}`;
    } else {
        timeText = `Bar ${barIndex}`;
    }
    
    const timeWidth = ctx.measureText(timeText).width + 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(mouseX - timeWidth/2, chartBottom + 5, timeWidth, 20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(timeText, mouseX, chartBottom + 18);
    
    ctx.restore();
}
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
    
    // Mouse events for panning and crosshair
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        updateGlobalPanVars();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left - panX;
        mouseY = e.clientY - rect.top - panY;
        showCrosshair = true;
        
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            panX += deltaX;
            panY += deltaY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            updateGlobalPanVars();
        }
        
        if (window.chartData && window.chartData.length > 0) {
            drawChart(window.chartData, window.pivotData);
        }
    });
    
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
        updateGlobalPanVars();
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        showCrosshair = false;
        canvas.style.cursor = 'grab';
        updateGlobalPanVars();
        
        if (window.chartData && window.chartData.length > 0) {
            drawChart(window.chartData, window.pivotData);
        }
    });
    
    canvas.addEventListener('mouseenter', function() {
        showCrosshair = true;
    });
    
    // Keyboard navigation for left/right arrows
    document.addEventListener('keydown', function(e) {
        if (!window.chartData || window.chartData.length === 0) return;
        
        const panSpeed = 50; // Pixels to pan per arrow press
        let needsRedraw = false;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                panX += panSpeed; // Move chart right (shows earlier data)
                needsRedraw = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                panX -= panSpeed; // Move chart left (shows later data)
                needsRedraw = true;
                break;
        }
        
        if (needsRedraw) {
            updateGlobalPanVars();
            drawChart(window.chartData, window.pivotData);
        }
    });
    
    // Make canvas focusable for keyboard events
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('click', function() {
        canvas.focus(); // Ensure canvas has focus for keyboard events
    });
    
    // Wheel event with proper passive handling
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
    }, { passive: false });
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
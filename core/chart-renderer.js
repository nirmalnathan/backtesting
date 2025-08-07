// chart-renderer.js - Main chart orchestrator using modular components

// Chart component instances
let chartBase = null;
let chartCandlesticks = null;
let chartOverlays = null;

// Import global variables from chart-base.js (they're defined there)
// panX, panY, isDragging, etc. are global variables defined in chart-base.js

// Initialize chart components
function initializeChartComponents() {
    if (!chartBase) {
        chartBase = new ChartBase();
        chartCandlesticks = new ChartCandlesticks(chartBase);
        chartOverlays = new ChartOverlays(chartBase);
    }
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
    
    // Initialize components if needed
    initializeChartComponents();
    
    // Initialize canvas
    if (!chartBase.initializeCanvas()) {
        console.error('Failed to initialize canvas');
        return;
    }
    
    if (data.length === 0) return;
    
    // Clear and draw background
    chartBase.clearCanvas();
    chartBase.drawBackground();
    
    // Calculate scaling and dimensions
    const priceScaling = chartBase.calculatePriceScaling(data);
    const barWidth = chartBase.calculateBarWidth(data);
    const barSpacing = chartBase.calculateBarSpacing(data);
    
    // Draw axes and grid
    const shiftedPrices = chartBase.drawYAxisGrid(priceScaling);
    chartBase.drawXAxis(data, barSpacing);
    
    // Draw chart content
    chartCandlesticks.drawCandlesticks(data, priceScaling, barWidth, barSpacing);
    chartOverlays.drawPivots(data, pivots, priceScaling, barSpacing);
    
    // Draw crosshair if mouse is over chart
    if (showCrosshair) {
        chartOverlays.drawCrosshair(data, mouseX, mouseY, priceScaling, barSpacing);
    }
    
    console.log('=== END CHART RENDERER DEBUG ===\n');
}

// Setup chart event listeners
function setupChartEventListeners() {
    const canvas = document.getElementById('chart');
    if (!canvas) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Mouse events for dragging
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        updateGlobalPanVars();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        // Update mouse position for crosshair
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        
        let needsRedraw = false;
        
        // Handle dragging - use global variables from chart-base.js
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            // Modify global pan variables (declared in chart-base.js)
            panX += deltaX;
            panY += deltaY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            // Update window globals
            updateGlobalPanVars();
            needsRedraw = true;
        } else {
            // Show tooltip when not dragging
            if (window.chartData && window.chartData.length > 0) {
                const barData = window.getBarAtPosition ? window.getBarAtPosition(mouseX, mouseY) : null;
                if (barData) {
                    window.showTooltip ? window.showTooltip(e.clientX, e.clientY, barData) : null;
                } else {
                    window.hideTooltip ? window.hideTooltip() : null;
                }
            }
            needsRedraw = showCrosshair; // Only redraw for crosshair updates
        }
        
        if (needsRedraw && window.chartData && window.chartData.length > 0) {
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
        
        // Hide tooltip
        window.hideTooltip ? window.hideTooltip() : null;
        
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
            case 'ArrowUp':
                e.preventDefault();
                panY += panSpeed; // Move chart down (shows lower prices)
                needsRedraw = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                panY -= panSpeed; // Move chart up (shows higher prices)
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
    
    // Add zoom slider event listeners
    const hZoomSlider = document.getElementById('hZoom');
    const vScaleSlider = document.getElementById('vScale');
    
    if (hZoomSlider) {
        hZoomSlider.addEventListener('input', function() {
            document.getElementById('hZoomValue').textContent = parseFloat(this.value).toFixed(1) + 'x';
            if (window.chartData && window.chartData.length > 0) {
                drawChart(window.chartData, window.pivotData);
            }
        });
    }
    
    if (vScaleSlider) {
        vScaleSlider.addEventListener('input', function() {
            document.getElementById('vScaleValue').textContent = parseFloat(this.value).toFixed(1) + 'x';
            if (window.chartData && window.chartData.length > 0) {
                drawChart(window.chartData, window.pivotData);
            }
        });
    }
    
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

// Export functions globally
window.resetZoomFunction = resetZoomInternal;
window.fitToScreenFunction = fitToScreenInternal;
// core/chart-base.js
// Canvas setup and basic drawing utilities

// Global chart variables
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
    window.lastMouseX = lastMouseX;
    window.lastMouseY = lastMouseY;
    window.mouseX = mouseX;
    window.mouseY = mouseY;
    window.showCrosshair = showCrosshair;
}

// Canvas setup and basic chart structure
class ChartBase {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.margin = { top: 30, right: 20, bottom: 80, left: 80 };
    }
    
    // Initialize canvas
    initializeCanvas() {
        this.canvas = document.getElementById('chart');
        const container = document.getElementById('chartContainer');
        
        if (!this.canvas || !container) {
            console.error('Chart canvas or container not found');
            return false;
        }
        
        // Set canvas size
        this.canvas.width = Math.max(canvasWidth, container.clientWidth);
        this.canvas.height = Math.max(canvasHeight, container.clientHeight);
        
        this.ctx = this.canvas.getContext('2d');
        return true;
    }
    
    // Clear canvas
    clearCanvas() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw background
    drawBackground() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Calculate chart dimensions
    getChartDimensions() {
        return {
            width: this.canvas.width - this.margin.left - this.margin.right,
            height: this.canvas.height - this.margin.top - this.margin.bottom
        };
    }
    
    // Calculate price scaling
    calculatePriceScaling(data) {
        const vScale = parseFloat(document.getElementById('vScale').value);
        
        const minPrice = Math.min(...data.map(d => d.low));
        const maxPrice = Math.max(...data.map(d => d.high));
        const originalPriceRange = maxPrice - minPrice;
        const priceRange = originalPriceRange / vScale;
        const centerPrice = (minPrice + maxPrice) / 2;
        const adjustedMinPrice = centerPrice - priceRange / 2;
        const adjustedMaxPrice = centerPrice + priceRange / 2;
        
        return {
            minPrice,
            maxPrice,
            priceRange,
            adjustedMinPrice,
            adjustedMaxPrice
        };
    }
    
    // Calculate bar width with zoom
    calculateBarWidth(data) {
        const hZoom = parseFloat(document.getElementById('hZoom').value);
        const chartDimensions = this.getChartDimensions();
        return Math.max(2, (chartDimensions.width / data.length) * hZoom);
    }
    
    // Draw Y-axis grid and labels
    drawYAxisGrid(priceScaling) {
        if (!this.ctx) return;
        
        const chartDimensions = this.getChartDimensions();
        const { priceRange, adjustedMinPrice, adjustedMaxPrice } = priceScaling;
        
        // Calculate price offset based on vertical panning
        const priceOffset = (panY / chartDimensions.height) * priceRange;
        const shiftedMinPrice = adjustedMinPrice + priceOffset;
        const shiftedMaxPrice = adjustedMaxPrice + priceOffset;
        
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        const gridLines = 10;
        
        for (let i = 0; i <= gridLines; i++) {
            const y = this.margin.top + (chartDimensions.height * i / gridLines);
            const price = shiftedMaxPrice - (priceRange * i / gridLines);
            
            // Draw horizontal grid line
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.canvas.width - this.margin.right, y);
            this.ctx.stroke();
            
            // Draw price label
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(price.toFixed(2), this.margin.left - 10, y + 4);
        }
        
        return { shiftedMinPrice, shiftedMaxPrice };
    }
    
    // Draw X-axis with time labels
    drawXAxis(data, barWidth) {
        if (!this.ctx || !data.length) return;
        
        const chartDimensions = this.getChartDimensions();
        
        // Draw X-axis line
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.canvas.height - this.margin.bottom);
        this.ctx.lineTo(this.canvas.width - this.margin.right, this.canvas.height - this.margin.bottom);
        this.ctx.stroke();
        
        // Draw time labels
        const labelInterval = Math.max(1, Math.floor(data.length / 10));
        this.ctx.fillStyle = '#666';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        
        for (let i = 0; i < data.length; i += labelInterval) {
            const x = this.margin.left + (i * barWidth) + panX;
            
            if (x >= this.margin.left && x <= this.canvas.width - this.margin.right) {
                // Fix: Use correct datetime field
                const dateSource = data[i].datetime || data[i].timestamp || data[i].date;
                const date = new Date(dateSource);
                
                if (!isNaN(date.getTime())) {
                    const timeString = date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    });
                    
                    // Draw vertical tick
                    this.ctx.strokeStyle = '#e0e0e0';
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, this.canvas.height - this.margin.bottom);
                    this.ctx.lineTo(x, this.canvas.height - this.margin.bottom + 5);
                    this.ctx.stroke();
                    
                    // Draw time label
                    this.ctx.fillText(timeString, x, this.canvas.height - this.margin.bottom + 20);
                    
                    // Draw date label if it's the first bar of the day
                    if (i === 0) {
                        const dateString = date.toLocaleDateString();
                        this.ctx.fillText(dateString, x, this.canvas.height - this.margin.bottom + 35);
                    } else if (i > 0) {
                        const prevDateSource = data[i-1].datetime || data[i-1].timestamp || data[i-1].date;
                        const prevDate = new Date(prevDateSource);
                        if (!isNaN(prevDate.getTime()) && date.toDateString() !== prevDate.toDateString()) {
                            const dateString = date.toLocaleDateString();
                            this.ctx.fillText(dateString, x, this.canvas.height - this.margin.bottom + 35);
                        }
                    }
                }
            }
        }
    }
    
    // Convert price to Y coordinate (with vertical panning)
    priceToY(price, shiftedMaxPrice, priceRange) {
        const chartDimensions = this.getChartDimensions();
        return this.margin.top + ((shiftedMaxPrice - price) / priceRange) * chartDimensions.height + panY;
    }
    
    // Convert Y coordinate to price (with vertical panning)
    yToPrice(y, shiftedMaxPrice, priceRange) {
        const chartDimensions = this.getChartDimensions();
        return shiftedMaxPrice - ((y - this.margin.top - panY) / chartDimensions.height) * priceRange;
    }
    
    // Convert index to X coordinate
    indexToX(index, barWidth) {
        return this.margin.left + (index * barWidth) + panX;
    }
    
    // Convert X coordinate to index
    xToIndex(x, barWidth) {
        return Math.floor((x - this.margin.left - panX) / barWidth);
    }
    
    // Get mouse position relative to chart area
    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
    
    // Check if point is within chart area
    isInChartArea(x, y) {
        const chartDimensions = this.getChartDimensions();
        return x >= this.margin.left && 
               x <= this.margin.left + chartDimensions.width &&
               y >= this.margin.top && 
               y <= this.margin.top + chartDimensions.height;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ChartBase = ChartBase;
    window.updateGlobalPanVars = updateGlobalPanVars;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartBase, updateGlobalPanVars };
}
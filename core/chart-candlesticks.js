// core/chart-candlesticks.js
// OHLC candlestick rendering functionality

class ChartCandlesticks {
    constructor(chartBase) {
        this.chartBase = chartBase;
    }
    
    // Draw all candlesticks
    drawCandlesticks(data, priceScaling, barWidth) {
        if (!this.chartBase.ctx || !data || data.length === 0) return;
        
        const { adjustedMaxPrice, priceRange } = priceScaling;
        const chartDimensions = this.chartBase.getChartDimensions();
        
        // Apply panning transformation for candlesticks
        this.chartBase.ctx.save();
        this.chartBase.ctx.translate(panX, panY);
        
        for (let i = 0; i < data.length; i++) {
            const bar = data[i];
            const x = this.chartBase.margin.left + (i * barWidth);
            
            // Calculate Y positions using base chart methods
            const openY = this.chartBase.priceToY(bar.open, adjustedMaxPrice, priceRange) - panY;
            const closeY = this.chartBase.priceToY(bar.close, adjustedMaxPrice, priceRange) - panY;
            const highY = this.chartBase.priceToY(bar.high, adjustedMaxPrice, priceRange) - panY;
            const lowY = this.chartBase.priceToY(bar.low, adjustedMaxPrice, priceRange) - panY;
            
            this.drawSingleCandlestick(x, openY, closeY, highY, lowY, barWidth, bar);
        }
        
        this.chartBase.ctx.restore();
    }
    
    // Draw a single candlestick
    drawSingleCandlestick(x, openY, closeY, highY, lowY, barWidth, bar) {
        const ctx = this.chartBase.ctx;
        
        // Determine color
        const isGreen = bar.close > bar.open;
        ctx.fillStyle = isGreen ? '#4CAF50' : '#F44336';
        ctx.strokeStyle = isGreen ? '#4CAF50' : '#F44336';
        
        // Draw high-low line (wick)
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, highY);
        ctx.lineTo(x + barWidth / 2, lowY);
        ctx.stroke();
        
        // Draw body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY);
        const bodyWidth = Math.max(1, barWidth - 2);
        const minBodyHeight = Math.max(1, bodyHeight);
        
        ctx.fillRect(x + 1, bodyTop, bodyWidth, minBodyHeight);
        
        // Draw thin outline for better visibility
        ctx.strokeStyle = isGreen ? '#2E7D32' : '#C62828';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, bodyTop, bodyWidth, minBodyHeight);
    }
    
    // Draw volume bars (if volume data available)
    drawVolumeBars(data, barWidth, volumeHeight = 60) {
        if (!this.chartBase.ctx || !data || data.length === 0) return;
        
        const ctx = this.chartBase.ctx;
        const chartDimensions = this.chartBase.getChartDimensions();
        
        // Check if volume data exists
        const hasVolume = data.some(bar => bar.volume !== undefined && bar.volume !== null);
        if (!hasVolume) return;
        
        // Calculate volume scaling
        const maxVolume = Math.max(...data.map(d => d.volume || 0));
        if (maxVolume === 0) return;
        
        // Volume area at bottom of chart
        const volumeTop = this.chartBase.canvas.height - this.chartBase.margin.bottom - volumeHeight;
        
        ctx.save();
        ctx.translate(panX, 0); // Only horizontal panning for volume
        
        for (let i = 0; i < data.length; i++) {
            const bar = data[i];
            if (!bar.volume) continue;
            
            const x = this.chartBase.margin.left + (i * barWidth);
            const volumeBarHeight = (bar.volume / maxVolume) * volumeHeight;
            const y = volumeTop + volumeHeight - volumeBarHeight;
            
            // Color based on price movement
            const isGreen = bar.close > bar.open;
            ctx.fillStyle = isGreen ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)';
            
            ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), volumeBarHeight);
        }
        
        ctx.restore();
        
        // Draw volume axis label
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Volume', this.chartBase.margin.left, volumeTop - 5);
        
        // Draw max volume label
        ctx.textAlign = 'right';
        ctx.fillText(this.formatVolume(maxVolume), this.chartBase.margin.left - 5, volumeTop + 10);
    }
    
    // Format volume numbers for display
    formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
    }
    
    // Get candlestick at specific index
    getCandlestickAtIndex(data, index) {
        if (!data || index < 0 || index >= data.length) return null;
        return data[index];
    }
    
    // Get candlestick at mouse position
    getCandlestickAtPosition(data, mouseX, barWidth) {
        const index = this.chartBase.xToIndex(mouseX, barWidth);
        return this.getCandlestickAtIndex(data, index);
    }
    
    // Check if mouse is over a candlestick
    isMouseOverCandlestick(mouseX, mouseY, index, data, barWidth, priceScaling) {
        if (!data || index < 0 || index >= data.length) return false;
        
        const bar = data[index];
        const x = this.chartBase.indexToX(index, barWidth);
        const { adjustedMaxPrice, priceRange } = priceScaling;
        
        const highY = this.chartBase.priceToY(bar.high, adjustedMaxPrice, priceRange);
        const lowY = this.chartBase.priceToY(bar.low, adjustedMaxPrice, priceRange);
        
        return mouseX >= x && mouseX <= x + barWidth && 
               mouseY >= highY && mouseY <= lowY;
    }
    
    // Highlight candlestick
    highlightCandlestick(index, data, barWidth, priceScaling) {
        if (!this.chartBase.ctx || !data || index < 0 || index >= data.length) return;
        
        const ctx = this.chartBase.ctx;
        const bar = data[index];
        const x = this.chartBase.indexToX(index, barWidth);
        const { adjustedMaxPrice, priceRange } = priceScaling;
        
        const openY = this.chartBase.priceToY(bar.open, adjustedMaxPrice, priceRange);
        const closeY = this.chartBase.priceToY(bar.close, adjustedMaxPrice, priceRange);
        const highY = this.chartBase.priceToY(bar.high, adjustedMaxPrice, priceRange);
        const lowY = this.chartBase.priceToY(bar.low, adjustedMaxPrice, priceRange);
        
        // Draw highlight outline
        ctx.strokeStyle = '#FFD700'; // Gold color
        ctx.lineWidth = 2;
        ctx.strokeRect(x, highY, barWidth, lowY - highY);
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ChartCandlesticks = ChartCandlesticks;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartCandlesticks;
}
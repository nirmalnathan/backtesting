// core/chart-overlays.js
// Pivot markers, crosshair, and interactive elements

class ChartOverlays {
    constructor(chartBase) {
        this.chartBase = chartBase;
    }
    
    // Draw all pivot markers
    drawPivots(data, pivots, priceScaling, barWidth) {
        if (!this.chartBase.ctx || !pivots || !data) return;
        
        console.log('\n🔵 Starting pivot rendering...');
        
        const { adjustedMaxPrice, priceRange } = priceScaling;
        
        // Apply panning transformation for pivots
        this.chartBase.ctx.save();
        this.chartBase.ctx.translate(panX, panY);
        
        // Draw all pivot types with proper spacing
        this.drawPivotType(data, pivots.sph || [], '#ff6b6b', 'SPH', true, false, adjustedMaxPrice, priceRange, barWidth);
        this.drawPivotType(data, pivots.spl || [], '#4ecdc4', 'SPL', false, false, adjustedMaxPrice, priceRange, barWidth);
        this.drawPivotType(data, pivots.lph || [], '#0000ff', 'LPH', true, true, adjustedMaxPrice, priceRange, barWidth);
        this.drawPivotType(data, pivots.lpl || [], '#ff00ff', 'LPL', false, true, adjustedMaxPrice, priceRange, barWidth);
        
        this.chartBase.ctx.restore();
        console.log('🔵 Finished pivot rendering');
    }
    
    // Draw specific pivot type
    drawPivotType(data, pivotIndices, color, label, isHigh, isLargePivot, adjustedMaxPrice, priceRange, barWidth) {
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
        
        const ctx = this.chartBase.ctx;
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
            
            const x = this.chartBase.margin.left + (index * barWidth) + barWidth / 2;
            const price = isHigh ? bar.high : bar.low;
            let y = this.chartBase.priceToY(price, adjustedMaxPrice, priceRange) - panY;
            
            // Apply offset for large pivots to avoid overlap
            if (isLargePivot) {
                if (isHigh) {
                    y -= 20; // Move LPH higher (above SPH)
                } else {
                    y += 20; // Move LPL lower (below SPL)
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
    
    // Draw crosshair with X and Y axis values
    drawCrosshair(data, mouseX, mouseY, priceScaling, barWidth) {
        if (!this.chartBase.ctx || !this.chartBase.isInChartArea(mouseX, mouseY)) return;
        
        const ctx = this.chartBase.ctx;
        const chartDimensions = this.chartBase.getChartDimensions();
        const { priceRange } = priceScaling;
        
        // Reset any transformations for crosshair drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Calculate shifted values for crosshair display
        const { shiftedMaxPrice } = this.calculateShiftedPrices(priceScaling);
        
        // Draw crosshair lines
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(mouseX, this.chartBase.margin.top);
        ctx.lineTo(mouseX, this.chartBase.margin.top + chartDimensions.height);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(this.chartBase.margin.left, mouseY);
        ctx.lineTo(this.chartBase.margin.left + chartDimensions.width, mouseY);
        ctx.stroke();
        
        // Draw value labels
        this.drawCrosshairLabels(data, mouseX, mouseY, shiftedMaxPrice, priceRange, barWidth, chartDimensions);
        
        ctx.setLineDash([]);
    }
    
    // Calculate shifted prices for crosshair
    calculateShiftedPrices(priceScaling) {
        const { priceRange, adjustedMinPrice, adjustedMaxPrice } = priceScaling;
        const chartDimensions = this.chartBase.getChartDimensions();
        
        const priceOffset = (panY / chartDimensions.height) * priceRange;
        const shiftedMinPrice = adjustedMinPrice + priceOffset;
        const shiftedMaxPrice = adjustedMaxPrice + priceOffset;
        
        return { shiftedMinPrice, shiftedMaxPrice };
    }
    
    // Draw crosshair value labels
    drawCrosshairLabels(data, mouseX, mouseY, shiftedMaxPrice, priceRange, barWidth, chartDimensions) {
        const ctx = this.chartBase.ctx;
        
        // Calculate bar index and price
        const barIndex = Math.floor((mouseX - panX - this.chartBase.margin.left) / barWidth);
        const price = shiftedMaxPrice - ((mouseY - this.chartBase.margin.top) / chartDimensions.height) * priceRange;
        
        // Draw value boxes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px Arial';
        
        // Y-axis price label
        const priceText = price.toFixed(2);
        const priceWidth = ctx.measureText(priceText).width + 10;
        ctx.fillRect(this.chartBase.margin.left - priceWidth - 5, mouseY - 10, priceWidth, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(priceText, this.chartBase.margin.left - 5, mouseY + 4);
        
        // X-axis bar/time label
        this.drawTimeLabel(data, barIndex, mouseX);
        
        // Draw OHLC tooltip if over valid bar
        if (barIndex >= 0 && barIndex < data.length) {
            this.drawOHLCTooltip(data[barIndex], mouseX, mouseY);
        }
    }
    
    // Draw time label on X-axis
    drawTimeLabel(data, barIndex, mouseX) {
        const ctx = this.chartBase.ctx;
        const chartDimensions = this.chartBase.getChartDimensions();
        
        let timeText = '';
        if (barIndex >= 0 && barIndex < data.length) {
            const bar = data[barIndex];
            const dateSource = bar.datetime || bar.timestamp || bar.date;
            
            try {
                if (dateSource) {
                    const date = new Date(dateSource);
                    if (!isNaN(date.getTime())) {
                        timeText = date.toLocaleDateString();
                    }
                }
            } catch (error) {
                timeText = `Bar ${barIndex}`;
            }
            
            if (!timeText) {
                timeText = `Bar ${barIndex}`;
            }
        } else {
            timeText = 'Invalid';
        }
        
        const timeWidth = ctx.measureText(timeText).width + 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(mouseX - timeWidth / 2, this.chartBase.margin.top + chartDimensions.height + 5, timeWidth, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(timeText, mouseX, this.chartBase.margin.top + chartDimensions.height + 18);
    }
    
    // Draw OHLC tooltip
    drawOHLCTooltip(bar, mouseX, mouseY) {
        const ctx = this.chartBase.ctx;
        
        const tooltipLines = [
            `O: ${bar.open.toFixed(2)}`,
            `H: ${bar.high.toFixed(2)}`,
            `L: ${bar.low.toFixed(2)}`,
            `C: ${bar.close.toFixed(2)}`
        ];
        
        if (bar.volume !== undefined) {
            tooltipLines.push(`V: ${this.formatVolume(bar.volume)}`);
        }
        
        // Calculate tooltip dimensions
        const lineHeight = 16;
        const padding = 8;
        const maxWidth = Math.max(...tooltipLines.map(line => ctx.measureText(line).width));
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = tooltipLines.length * lineHeight + padding * 2;
        
        // Position tooltip to avoid edges
        let tooltipX = mouseX + 15;
        let tooltipY = mouseY - tooltipHeight - 15;
        
        if (tooltipX + tooltipWidth > this.chartBase.canvas.width - 20) {
            tooltipX = mouseX - tooltipWidth - 15;
        }
        if (tooltipY < 20) {
            tooltipY = mouseY + 15;
        }
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        tooltipLines.forEach((line, index) => {
            ctx.fillText(line, tooltipX + padding, tooltipY + padding + (index + 1) * lineHeight);
        });
    }
    
    // Format volume for tooltip display
    formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
    }
    
    // Draw trend lines
    drawTrendLines(trendLines, priceScaling, barWidth) {
        if (!this.chartBase.ctx || !trendLines || trendLines.length === 0) return;
        
        const ctx = this.chartBase.ctx;
        const { adjustedMaxPrice, priceRange } = priceScaling;
        
        ctx.save();
        ctx.translate(panX, panY);
        
        trendLines.forEach(line => {
            ctx.strokeStyle = line.color || '#888';
            ctx.lineWidth = line.width || 1;
            ctx.setLineDash(line.dashed ? [5, 5] : []);
            
            ctx.beginPath();
            const startX = this.chartBase.margin.left + (line.startIndex * barWidth);
            const startY = this.chartBase.priceToY(line.startPrice, adjustedMaxPrice, priceRange) - panY;
            const endX = this.chartBase.margin.left + (line.endIndex * barWidth);
            const endY = this.chartBase.priceToY(line.endPrice, adjustedMaxPrice, priceRange) - panY;
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.setLineDash([]);
        });
        
        ctx.restore();
    }
    
    // Draw support/resistance levels
    drawSupportResistanceLevels(levels, priceScaling) {
        if (!this.chartBase.ctx || !levels || levels.length === 0) return;
        
        const ctx = this.chartBase.ctx;
        const { adjustedMaxPrice, priceRange } = priceScaling;
        const chartDimensions = this.chartBase.getChartDimensions();
        
        levels.forEach(level => {
            const y = this.chartBase.priceToY(level.price, adjustedMaxPrice, priceRange);
            
            ctx.strokeStyle = level.type === 'support' ? '#4CAF50' : '#F44336';
            ctx.lineWidth = level.strength || 1;
            ctx.setLineDash([10, 5]);
            
            ctx.beginPath();
            ctx.moveTo(this.chartBase.margin.left, y);
            ctx.lineTo(this.chartBase.margin.left + chartDimensions.width, y);
            ctx.stroke();
            
            // Draw level label
            ctx.fillStyle = level.type === 'support' ? '#4CAF50' : '#F44336';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${level.type}: ${level.price.toFixed(2)}`, this.chartBase.margin.left + 5, y - 5);
            
            ctx.setLineDash([]);
        });
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ChartOverlays = ChartOverlays;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartOverlays;
}
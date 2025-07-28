// backtest/ui/results-charts.js
// Performance charts and visualizations

class ResultsCharts {
    constructor() {
        this.lastTrades = null;
        this.chartsContainer = null;
    }
    
    // Create and display charts
    displayCharts(trades, stats) {
        this.lastTrades = trades;
        
        if (!this.chartsContainer) {
            this.createChartsContainer();
        }
        
        this.renderEquityCurve(trades);
        this.renderDrawdownChart(trades);
        this.renderWinLossDistribution(trades);
        this.renderTimeAnalysis(trades);
    }
    
    // Create charts container
    createChartsContainer() {
        this.chartsContainer = document.createElement('div');
        this.chartsContainer.id = 'charts-container';
        this.chartsContainer.className = 'charts-container';
        
        const tableDiv = document.getElementById('trades-table-container');
        if (tableDiv) {
            tableDiv.parentNode.insertBefore(this.chartsContainer, tableDiv.nextSibling);
        } else {
            document.body.appendChild(this.chartsContainer);
        }
        
        this.chartsContainer.innerHTML = `
            <h3>Performance Charts</h3>
            <div class="charts-grid">
                <div class="chart-item">
                    <h4>Equity Curve</h4>
                    <canvas id="equity-curve-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-item">
                    <h4>Drawdown Chart</h4>
                    <canvas id="drawdown-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-item">
                    <h4>Win/Loss Distribution</h4>
                    <canvas id="winloss-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-item">
                    <h4>Time Analysis</h4>
                    <canvas id="time-analysis-chart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }
    
    // Render equity curve
    renderEquityCurve(trades) {
        const canvas = document.getElementById('equity-curve-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (trades.length === 0) return;
        
        // Calculate running total
        let runningTotal = 0;
        const equityPoints = trades.map((trade, index) => {
            runningTotal += trade.points;
            return { x: index, y: runningTotal };
        });
        
        // Find min/max for scaling
        const maxY = Math.max(...equityPoints.map(p => p.y));
        const minY = Math.min(...equityPoints.map(p => p.y));
        const range = maxY - minY;
        const padding = 20;
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Draw zero line if applicable
        if (minY < 0 && maxY > 0) {
            const zeroY = canvas.height - padding - ((0 - minY) / range) * (canvas.height - 2 * padding);
            ctx.strokeStyle = '#888';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding, zeroY);
            ctx.lineTo(canvas.width - padding, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw equity curve
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        equityPoints.forEach((point, index) => {
            const x = padding + (point.x / (trades.length - 1)) * (canvas.width - 2 * padding);
            const y = canvas.height - padding - ((point.y - minY) / range) * (canvas.height - 2 * padding);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`Start: 0`, padding + 5, canvas.height - 5);
        ctx.fillText(`End: ${runningTotal.toFixed(2)}`, canvas.width - 80, canvas.height - 5);
        ctx.fillText(`Max: ${maxY.toFixed(2)}`, padding + 5, 15);
        ctx.fillText(`Min: ${minY.toFixed(2)}`, padding + 5, 30);
    }
    
    // Render drawdown chart
    renderDrawdownChart(trades) {
        const canvas = document.getElementById('drawdown-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (trades.length === 0) return;
        
        // Calculate drawdown
        let runningTotal = 0;
        let peak = 0;
        const drawdownPoints = trades.map((trade, index) => {
            runningTotal += trade.points;
            if (runningTotal > peak) peak = runningTotal;
            const drawdown = peak - runningTotal;
            return { x: index, y: -drawdown };
        });
        
        // Find max drawdown for scaling
        const maxDrawdown = Math.max(...drawdownPoints.map(p => Math.abs(p.y)));
        const padding = 20;
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Draw zero line
        ctx.strokeStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(canvas.width - padding, padding);
        ctx.stroke();
        
        // Fill drawdown area
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        
        drawdownPoints.forEach((point, index) => {
            const x = padding + (point.x / (trades.length - 1)) * (canvas.width - 2 * padding);
            const y = padding - (point.y / maxDrawdown) * (canvas.height - 2 * padding);
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(canvas.width - padding, padding);
        ctx.closePath();
        ctx.fill();
        
        // Draw drawdown line
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        drawdownPoints.forEach((point, index) => {
            const x = padding + (point.x / (trades.length - 1)) * (canvas.width - 2 * padding);
            const y = padding - (point.y / maxDrawdown) * (canvas.height - 2 * padding);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('0%', padding + 5, 15);
        ctx.fillText(`Max DD: ${maxDrawdown.toFixed(2)}`, padding + 5, canvas.height - 5);
    }
    
    // Render win/loss distribution
    renderWinLossDistribution(trades) {
        const canvas = document.getElementById('winloss-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (trades.length === 0) return;
        
        // Create buckets for P&L distribution
        const buckets = {};
        const bucketSize = 5; // 5 points per bucket
        
        trades.forEach(trade => {
            const bucket = Math.floor(trade.points / bucketSize) * bucketSize;
            buckets[bucket] = (buckets[bucket] || 0) + 1;
        });
        
        const sortedBuckets = Object.keys(buckets).map(Number).sort((a, b) => a - b);
        const maxCount = Math.max(...Object.values(buckets));
        
        const padding = 30;
        const barWidth = (canvas.width - 2 * padding) / sortedBuckets.length;
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Draw bars
        sortedBuckets.forEach((bucket, index) => {
            const count = buckets[bucket];
            const barHeight = (count / maxCount) * (canvas.height - 2 * padding);
            const x = padding + index * barWidth;
            const y = canvas.height - padding - barHeight;
            
            // Color based on profit/loss
            ctx.fillStyle = bucket >= 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(x, y, barWidth - 1, barHeight);
            
            // Add bucket label
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.save();
            ctx.translate(x + barWidth/2, canvas.height - 5);
            ctx.rotate(-Math.PI/4);
            ctx.fillText(bucket.toString(), 0, 0);
            ctx.restore();
        });
        
        // Add zero line
        const zeroIndex = sortedBuckets.findIndex(b => b >= 0);
        if (zeroIndex > 0) {
            const zeroX = padding + zeroIndex * barWidth;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(zeroX, padding);
            ctx.lineTo(zeroX, canvas.height - padding);
            ctx.stroke();
        }
        
        // Add title
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('P&L Distribution (Points)', 5, 15);
    }
    
    // Render time analysis
    renderTimeAnalysis(trades) {
        const canvas = document.getElementById('time-analysis-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (trades.length === 0) return;
        
        // Group by hour of entry
        const hourlyData = {};
        trades.forEach(trade => {
            const hour = new Date(trade.entryTime).getHours();
            if (!hourlyData[hour]) {
                hourlyData[hour] = { count: 0, totalPoints: 0 };
            }
            hourlyData[hour].count++;
            hourlyData[hour].totalPoints += trade.points;
        });
        
        const hours = Object.keys(hourlyData).map(Number).sort((a, b) => a - b);
        const maxCount = Math.max(...Object.values(hourlyData).map(h => h.count));
        const maxPoints = Math.max(...Object.values(hourlyData).map(h => Math.abs(h.totalPoints)));
        
        const padding = 30;
        const barWidth = (canvas.width - 2 * padding) / 24; // 24 hours
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Draw bars for each hour
        for (let hour = 0; hour < 24; hour++) {
            const data = hourlyData[hour];
            if (!data) continue;
            
            const x = padding + hour * barWidth;
            const barHeight = (data.count / maxCount) * (canvas.height - 2 * padding) * 0.8;
            const y = canvas.height - padding - barHeight;
            
            // Color based on profitability
            const avgPoints = data.totalPoints / data.count;
            ctx.fillStyle = avgPoints >= 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(x, y, barWidth - 1, barHeight);
            
            // Add hour label
            if (hour % 3 === 0) {
                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.fillText(hour.toString(), x, canvas.height - 5);
            }
        }
        
        // Add title
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('Trades by Hour of Day', 5, 15);
    }
    
    // Show charts container
    showCharts() {
        if (this.chartsContainer) {
            this.chartsContainer.style.display = 'block';
        }
    }
    
    // Clear charts
    clearCharts() {
        if (this.chartsContainer) {
            this.chartsContainer.style.display = 'none';
        }
        this.lastTrades = null;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.ResultsCharts = ResultsCharts;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsCharts;
}
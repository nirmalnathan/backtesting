// data-processor.js
// Handles CSV parsing and timeframe conversion

// Parse datetime from YYYYMMDD HHMMSS format
function parseDateTime(dateTimeStr) {
    if (!dateTimeStr || typeof dateTimeStr !== 'string') return null;
    
    try {
        const year = dateTimeStr.substring(0, 4);
        const month = dateTimeStr.substring(4, 6);
        const day = dateTimeStr.substring(6, 8);
        const hour = dateTimeStr.substring(9, 11);
        const minute = dateTimeStr.substring(11, 13);
        const second = dateTimeStr.substring(13, 15);
        
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    } catch (err) {
        console.error("Error parsing date:", dateTimeStr, err);
        return null;
    }
}

// Parse CSV data
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const data = [];
    
    for (let line of lines) {
        if (line.trim() === '') continue;
        
        const parts = line.split(';');
        if (parts.length >= 5) {
            const datetime = parts[0];
            const open = parseFloat(parts[1]);
            const high = parseFloat(parts[2]);
            const low = parseFloat(parts[3]);
            const close = parseFloat(parts[4]);
            const volume = parts[5] ? parseFloat(parts[5]) : 0;
            
            if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
                const date = parseDateTime(datetime);
                if (date) {
                    data.push({ datetime, date, open, high, low, close, volume });
                }
            }
        }
    }
    
    return data.sort((a, b) => a.date - b.date);
}

// Convert data to specified timeframe
function convertToTimeframe(data, minutes) {
    if (data.length === 0) return [];
    
    const result = [];
    let currentBar = null;
    
    data.forEach(tick => {
        const tickTime = new Date(tick.date);
        
        // Round to timeframe interval
        const intervalStart = new Date(tickTime);
        const totalMinutes = intervalStart.getHours() * 60 + intervalStart.getMinutes();
        const roundedMinutes = Math.floor(totalMinutes / minutes) * minutes;
        intervalStart.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0);
        
        const intervalKey = intervalStart.getTime();
        
        if (!currentBar || currentBar.intervalKey !== intervalKey) {
            if (currentBar) {
                result.push(currentBar);
            }
            
            currentBar = {
                intervalKey,
                date: intervalStart,
                datetime: intervalStart.toISOString(),
                open: tick.open,
                high: tick.high,
                low: tick.low,
                close: tick.close,
                volume: tick.volume,
                tickCount: 1
            };
        } else {
            currentBar.high = Math.max(currentBar.high, tick.high);
            currentBar.low = Math.min(currentBar.low, tick.low);
            currentBar.close = tick.close;
            currentBar.volume += tick.volume;
            currentBar.tickCount++;
        }
    });
    
    if (currentBar) {
        result.push(currentBar);
    }
    
    return result;
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}
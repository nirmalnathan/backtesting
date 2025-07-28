// utils/storage-manager.js
// Centralized localStorage management for backtest configuration and results

class StorageManager {
    constructor() {
        this.storageKeys = {
            ruleConfig: 'backtestRuleConfig',
            lastResults: 'backtestLastResults',
            resultHistory: 'backtestResultHistory',
            userPreferences: 'backtestUserPreferences',
            configBackups: 'backtestConfigBackups'
        };
        
        this.maxHistoryEntries = 10;
        this.maxBackups = 5;
    }
    
    // Save rule configuration
    saveRuleConfiguration(config) {
        try {
            const configToSave = {
                ...config,
                savedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKeys.ruleConfig, JSON.stringify(configToSave));
            console.log('Rule configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save rule configuration:', error);
            return false;
        }
    }
    
    // Load rule configuration
    loadRuleConfiguration() {
        try {
            const saved = localStorage.getItem(this.storageKeys.ruleConfig);
            if (!saved) return null;
            
            const config = JSON.parse(saved);
            
            // Remove metadata before returning
            delete config.savedAt;
            delete config.version;
            
            console.log('Rule configuration loaded successfully');
            return config;
        } catch (error) {
            console.error('Failed to load rule configuration:', error);
            return null;
        }
    }
    
    // Save backtest results
    saveResults(trades, statistics, configuration) {
        try {
            const resultsData = {
                trades,
                statistics,
                configuration,
                savedAt: new Date().toISOString(),
                version: '1.0',
                id: Date.now()
            };
            
            // Save as last results
            localStorage.setItem(this.storageKeys.lastResults, JSON.stringify(resultsData));
            
            // Add to results history
            this.addToResultHistory(resultsData);
            
            console.log('Backtest results saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save backtest results:', error);
            return false;
        }
    }
    
    // Load last backtest results
    loadLastResults() {
        try {
            const saved = localStorage.getItem(this.storageKeys.lastResults);
            if (!saved) return null;
            
            const results = JSON.parse(saved);
            console.log('Last backtest results loaded successfully');
            return results;
        } catch (error) {
            console.error('Failed to load last results:', error);
            return null;
        }
    }
    
    // Add results to history
    addToResultHistory(resultsData) {
        try {
            let history = this.loadResultHistory() || [];
            
            // Create summary for history entry
            const historyEntry = {
                id: resultsData.id,
                savedAt: resultsData.savedAt,
                summary: {
                    totalTrades: resultsData.statistics.totalTrades,
                    totalPoints: resultsData.statistics.totalPoints,
                    winRate: resultsData.statistics.winRate,
                    avgPointsPerTrade: resultsData.statistics.avgPoints || 0
                },
                configuration: resultsData.configuration,
                // Store only essential trade data for history
                tradesSummary: {
                    count: resultsData.trades.length,
                    firstTradeTime: resultsData.trades.length > 0 ? resultsData.trades[0].entryTime : null,
                    lastTradeTime: resultsData.trades.length > 0 ? resultsData.trades[resultsData.trades.length - 1].exitTime : null
                }
            };
            
            // Add new result to beginning of array
            history.unshift(historyEntry);
            
            // Keep only last N results to prevent storage bloat
            history = history.slice(0, this.maxHistoryEntries);
            
            localStorage.setItem(this.storageKeys.resultHistory, JSON.stringify(history));
            console.log('Added to result history');
            return true;
        } catch (error) {
            console.error('Failed to add to result history:', error);
            return false;
        }
    }
    
    // Load result history
    loadResultHistory() {
        try {
            const saved = localStorage.getItem(this.storageKeys.resultHistory);
            if (!saved) return [];
            
            const history = JSON.parse(saved);
            console.log(`Loaded ${history.length} historical results`);
            return history;
        } catch (error) {
            console.error('Failed to load result history:', error);
            return [];
        }
    }
    
    // Save user preferences
    saveUserPreferences(preferences) {
        try {
            const prefsToSave = {
                ...preferences,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKeys.userPreferences, JSON.stringify(prefsToSave));
            console.log('User preferences saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save user preferences:', error);
            return false;
        }
    }
    
    // Load user preferences
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem(this.storageKeys.userPreferences);
            if (!saved) return this.getDefaultPreferences();
            
            const prefs = JSON.parse(saved);
            delete prefs.savedAt;
            
            // Merge with defaults to handle missing properties
            return { ...this.getDefaultPreferences(), ...prefs };
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            return this.getDefaultPreferences();
        }
    }
    
    // Get default user preferences
    getDefaultPreferences() {
        return {
            autoSaveResults: true,
            showDetailedAnalysis: true,
            defaultStopLoss: 0.3,
            confirmBeforeReset: true,
            exportFormat: 'json',
            maxHistoryEntries: 10,
            enableConfigBackups: true
        };
    }
    
    // Create configuration backup
    createConfigBackup() {
        try {
            const config = this.loadRuleConfiguration();
            if (!config) {
                console.log('No configuration to backup');
                return null;
            }
            
            const backup = {
                ...config,
                backupCreatedAt: new Date().toISOString(),
                backupId: Date.now(),
                backupName: `Config Backup ${new Date().toLocaleString()}`
            };
            
            // Load existing backups
            let backups = this.loadConfigBackups() || [];
            
            // Add new backup to beginning
            backups.unshift(backup);
            
            // Keep only last N backups
            backups = backups.slice(0, this.maxBackups);
            
            // Save updated backups
            localStorage.setItem(this.storageKeys.configBackups, JSON.stringify(backups));
            
            console.log('Configuration backup created:', backup.backupName);
            return backup.backupId;
        } catch (error) {
            console.error('Failed to create config backup:', error);
            return null;
        }
    }
    
    // Load configuration backups
    loadConfigBackups() {
        try {
            const saved = localStorage.getItem(this.storageKeys.configBackups);
            if (!saved) return [];
            
            const backups = JSON.parse(saved);
            console.log(`Loaded ${backups.length} configuration backups`);
            return backups;
        } catch (error) {
            console.error('Failed to load config backups:', error);
            return [];
        }
    }
    
    // Restore configuration from backup
    restoreConfigBackup(backupId) {
        try {
            const backups = this.loadConfigBackups();
            const backup = backups.find(b => b.backupId === backupId);
            
            if (!backup) {
                throw new Error('Backup not found');
            }
            
            // Remove backup metadata
            const config = { ...backup };
            delete config.backupCreatedAt;
            delete config.backupId;
            delete config.backupName;
            
            this.saveRuleConfiguration(config);
            console.log('Configuration restored from backup');
            return true;
        } catch (error) {
            console.error('Failed to restore config backup:', error);
            return false;
        }
    }
    
    // Delete configuration backup
    deleteConfigBackup(backupId) {
        try {
            let backups = this.loadConfigBackups();
            backups = backups.filter(b => b.backupId !== backupId);
            
            localStorage.setItem(this.storageKeys.configBackups, JSON.stringify(backups));
            console.log('Configuration backup deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete config backup:', error);
            return false;
        }
    }
    
    // Clear all stored data
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('All backtest data cleared from storage');
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
    
    // Clear only results (keep configuration)
    clearResults() {
        try {
            localStorage.removeItem(this.storageKeys.lastResults);
            localStorage.removeItem(this.storageKeys.resultHistory);
            
            console.log('Results cleared from storage');
            return true;
        } catch (error) {
            console.error('Failed to clear results:', error);
            return false;
        }
    }
    
    // Export all data
    exportAllData() {
        try {
            const exportData = {
                ruleConfiguration: this.loadRuleConfiguration(),
                lastResults: this.loadLastResults(),
                resultHistory: this.loadResultHistory(),
                configBackups: this.loadConfigBackups(),
                userPreferences: this.loadUserPreferences(),
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            return exportData;
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }
    
    // Import all data
    importAllData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid import data');
            }
            
            // Validate data structure
            if (data.version !== '1.0') {
                console.warn('Import data version mismatch');
            }
            
            let importedCount = 0;
            
            // Import each section
            if (data.ruleConfiguration) {
                this.saveRuleConfiguration(data.ruleConfiguration);
                importedCount++;
            }
            
            if (data.lastResults) {
                localStorage.setItem(this.storageKeys.lastResults, JSON.stringify(data.lastResults));
                importedCount++;
            }
            
            if (data.resultHistory) {
                localStorage.setItem(this.storageKeys.resultHistory, JSON.stringify(data.resultHistory));
                importedCount++;
            }
            
            if (data.configBackups) {
                localStorage.setItem(this.storageKeys.configBackups, JSON.stringify(data.configBackups));
                importedCount++;
            }
            
            if (data.userPreferences) {
                this.saveUserPreferences(data.userPreferences);
                importedCount++;
            }
            
            console.log(`Data imported successfully: ${importedCount} sections`);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
    
    // Get storage usage info
    getStorageInfo() {
        try {
            const info = {};
            let totalSize = 0;
            
            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                info[name] = {
                    exists: !!data,
                    size: size,
                    sizeKB: (size / 1024).toFixed(2),
                    sizeMB: (size / 1024 / 1024).toFixed(3)
                };
                totalSize += size;
            });
            
            info.total = {
                size: totalSize,
                sizeKB: (totalSize / 1024).toFixed(2),
                sizeMB: (totalSize / 1024 / 1024).toFixed(3)
            };
            
            // Calculate localStorage usage percentage
            try {
                const testKey = '__storage_test__';
                let testSize = 0;
                while (testSize < 10 * 1024 * 1024) { // Test up to 10MB
                    try {
                        localStorage.setItem(testKey, 'x'.repeat(testSize));
                        testSize += 1024;
                    } catch (e) {
                        break;
                    }
                }
                localStorage.removeItem(testKey);
                
                info.total.maxEstimated = testSize;
                info.total.usagePercent = ((totalSize / testSize) * 100).toFixed(1);
            } catch (e) {
                info.total.usagePercent = 'Unknown';
            }
            
            return info;
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }
    
    // Check if storage is available
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage not available:', error);
            return false;
        }
    }
    
    // Cleanup old data
    cleanupOldData() {
        try {
            let cleanedItems = 0;
            
            // Clean up old result history entries
            const history = this.loadResultHistory();
            if (history.length > this.maxHistoryEntries) {
                const cleanedHistory = history.slice(0, this.maxHistoryEntries);
                localStorage.setItem(this.storageKeys.resultHistory, JSON.stringify(cleanedHistory));
                cleanedItems += history.length - this.maxHistoryEntries;
            }
            
            // Clean up old config backups
            const backups = this.loadConfigBackups();
            if (backups.length > this.maxBackups) {
                const cleanedBackups = backups.slice(0, this.maxBackups);
                localStorage.setItem(this.storageKeys.configBackups, JSON.stringify(cleanedBackups));
                cleanedItems += backups.length - this.maxBackups;
            }
            
            console.log(`Cleanup completed: ${cleanedItems} items removed`);
            return cleanedItems;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            return 0;
        }
    }
    
    // Auto-save current session
    autoSave() {
        try {
            if (window.ruleConfig) {
                this.saveRuleConfiguration(window.ruleConfig);
            }
            
            // Auto-cleanup
            this.cleanupOldData();
            
            return true;
        } catch (error) {
            console.error('Auto-save failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const storageManager = new StorageManager();

// Global functions for easy access
function saveRuleConfig(config) {
    return storageManager.saveRuleConfiguration(config);
}

function loadRuleConfig() {
    return storageManager.loadRuleConfiguration();
}

function saveBacktestResults(trades, statistics, configuration) {
    return storageManager.saveResults(trades, statistics, configuration);
}

function loadLastBacktestResults() {
    return storageManager.loadLastResults();
}

function clearBacktestData() {
    return storageManager.clearAllData();
}

function getStorageInfo() {
    return storageManager.getStorageInfo();
}

function createConfigBackup() {
    return storageManager.createConfigBackup();
}

function loadConfigBackups() {
    return storageManager.loadConfigBackups();
}

function restoreConfigBackup(backupId) {
    return storageManager.restoreConfigBackup(backupId);
}

// Auto-save on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        storageManager.autoSave();
    });
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
    window.storageManager = storageManager;
    window.saveRuleConfig = saveRuleConfig;
    window.loadRuleConfig = loadRuleConfig;
    window.saveBacktestResults = saveBacktestResults;
    window.loadLastBacktestResults = loadLastBacktestResults;
    window.clearBacktestData = clearBacktestData;
    window.getStorageInfo = getStorageInfo;
    window.createConfigBackup = createConfigBackup;
    window.loadConfigBackups = loadConfigBackups;
    window.restoreConfigBackup = restoreConfigBackup;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        StorageManager, 
        storageManager,
        saveRuleConfig,
        loadRuleConfig,
        saveBacktestResults,
        loadLastBacktestResults,
        clearBacktestData,
        getStorageInfo,
        createConfigBackup,
        loadConfigBackups,
        restoreConfigBackup
    };
}
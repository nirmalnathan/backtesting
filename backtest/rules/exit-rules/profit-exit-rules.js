// backtest/rules/exit-rules/profit-exit-rules.js
// Exit rules for taking profits

const PROFIT_EXIT_RULES = {
    // Placeholder for future profit exit rules when implemented
    // Will be added here when specific profit-taking strategies are implemented
};

// Export for use in rule processor
if (typeof window !== 'undefined') {
    window.PROFIT_EXIT_RULES = PROFIT_EXIT_RULES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROFIT_EXIT_RULES };
}
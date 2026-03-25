const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Helper to generate trend data
const generateTrend = (monthsBack, monthsForward) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();

    let data = [];

    // Past Data (Historical)
    for (let i = monthsBack; i > 0; i--) {
        const idx = (currentMonthIdx - i + 12) % 12;
        data.push({
            month: months[idx],
            revenue: Math.floor(Math.random() * (50000 - 30000) + 30000), // Random 30k-50k
            patients: Math.floor(Math.random() * (500 - 300) + 300),
            type: 'Historical'
        });
    }

    // Current Month (Projected End)
    const currentRev = 55000;
    const currentPat = 520;
    data.push({
        month: months[currentMonthIdx],
        revenue: currentRev,
        patients: currentPat,
        type: 'Current'
    });

    // Future Prediction (Linear Regression - Simplified)
    // We assume a 10% growth trend for the simulation
    for (let i = 1; i <= monthsForward; i++) {
        const idx = (currentMonthIdx + i) % 12;
        data.push({
            month: months[idx],
            revenue: Math.floor(currentRev * (1 + 0.1 * i)), // +10% growth
            patients: Math.floor(currentPat * (1 + 0.05 * i)), // +5% growth
            type: 'Predicted'
        });
    }

    return data;
};

// GET /api/admin/analytics/dashboard
router.get('/dashboard', verifyToken, (req, res) => {
    // In a real app, strict admin check here
    // if (req.user.type !== 'admin') ...

    const trendData = generateTrend(6, 2); // 6 months back, 2 months forward

    res.json({
        trends: trendData,
        summary: {
            totalRevenue: trendData.filter(d => d.type === 'Historical').reduce((a, b) => a + b.revenue, 0),
            projectedRevenue: trendData.find(d => d.type === 'Predicted').revenue,
            growthRate: "+12.5%"
        }
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/', authenticate, requireRole(['admin', 'district_officer']), analyticsController.getAnalyticsData);

module.exports = router;

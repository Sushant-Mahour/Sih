const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/status', optionalAuthenticate, emergencyController.getEmergencyStatus);
router.post('/toggle', optionalAuthenticate, emergencyController.toggleEmergencyMode);
router.post('/road-block', optionalAuthenticate, emergencyController.declareRoadBlock);
router.post('/clear-block/:id', optionalAuthenticate, emergencyController.clearRoadBlock);
router.post('/sitrep', optionalAuthenticate, emergencyController.generateSitRep);

module.exports = router;

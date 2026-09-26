const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Configure multer memory storage (limit 25MB for datasets)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// All dataset ingestion routes strictly require Commandant / Admin role
router.use(authenticate, requireRole(['admin']));

router.post('/upload', upload.single('dataset'), (req, res, next) => importController.uploadAndAnalyze(req, res, next));
router.post('/commit/:auditId', (req, res, next) => importController.commitImport(req, res, next));
router.get('/history', (req, res, next) => importController.getHistory(req, res, next));
router.get('/:id', (req, res, next) => importController.getById(req, res, next));

module.exports = router;

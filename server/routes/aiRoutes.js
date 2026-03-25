const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// Memory storage for file uploads (max 5MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /api/ai/analyze - Protected, handles Text + File
router.post('/analyze', verifyToken, upload.single('file'), aiController.analyze);

module.exports = router;

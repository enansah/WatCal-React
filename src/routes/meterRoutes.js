// routes/meterRoutes.js
const express = require('express');
const router = express.Router();
const { limits } = require('../../utils/rateLimit');
const { uploadReadings } = require('../controllers/meterUpload');

// On-site devices send meter readings here (protected by the X-Meter-Key header, not a login).
// XML bodies arrive as text; JSON is already parsed by the app's JSON middleware.
router.post('/meterReadings', limits.meterKey, express.text({ type: ['application/xml', 'text/xml'], limit: '256kb' }), uploadReadings);

module.exports = router;

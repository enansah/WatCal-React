// routes/googleRoutes.js
const express = require('express');
const { getConfig, googleSignIn } = require('../controllers/googleAuth');

const router = express.Router();
const { limits } = require('../../utils/rateLimit');

router.get('/auth/google/config', getConfig);
router.post('/auth/google', limits.google, googleSignIn);

module.exports = router;

// routes/RedirectRoute.js
const express = require('express');
const router = express.Router();
const { limits } = require('../../utils/rateLimit');
const RedirectController = require('../controllers/RedirectController');


// Route to get tenant data
router.post('/viewTenant', limits.viewBill, RedirectController.getTenantData);

module.exports = router;

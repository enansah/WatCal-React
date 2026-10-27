// routes/tenantRoutes.js
const express = require('express');
const { registerTenant, loginTenant, forgotPasswordTenant, resetPasswordTenant } = require('../controllers/tenantController');
const {updateUserProfile, updateAvatar, getUserProfile} = require('../controllers/tenantUpdate');
const TauthMiddleware = require('../middleware/TauthMiddleware');
const tenantDashboard = require('../controllers/tenantDashboard');

const router = express.Router();
const { limits } = require('../../utils/rateLimit');

router.post('/tenantSignup', limits.signup, registerTenant);
router.post('/tenantLogin', limits.login, loginTenant);
router.post('/forgotPasswordTenant', limits.forgotPassword, forgotPasswordTenant);
router.post('/resetPasswordTenant', limits.resetPassword, resetPasswordTenant);

router.post('/updateTenant', TauthMiddleware, updateUserProfile);
router.get('/getProfile', TauthMiddleware, getUserProfile);  //get user profile
router.get('/tenant/:username/data', TauthMiddleware, tenantDashboard.ownDataOnly, tenantDashboard.getTenantData);
router.get('/tenant-history/:username/:month/:year', TauthMiddleware, tenantDashboard.ownDataOnly, tenantDashboard.getTenantDataByMonth);
router.get('/tenantDashboard', TauthMiddleware, tenantDashboard.getDashboard);
router.get('/tenantHistory/:month/:year', TauthMiddleware, tenantDashboard.getHistory);
router.post('/tenantAvatar', TauthMiddleware, updateAvatar);  // set or remove profile photo


router.get('/tenantIsAuthenticated', (req, res) => {
    if (req.session.tenant) {
        const { password, readings, ...tenant } = req.session.tenant; // never send the password hash; readings load separately
        res.status(200).json({ isAuthenticated: true, tenant });
    } 
    else {
        res.status(200).json({ isAuthenticated: false });
    }
    });

router.post('/tenantLogout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
        return res.status(500).json({ msg: 'Logout failed' });
        }
        res.status(200).json({ msg: 'Logout successful' });
    });
});

module.exports = router;

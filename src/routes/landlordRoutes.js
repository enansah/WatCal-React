// routes/landlordRoutes.js
const express = require('express');
const { registerLandlord, loginLandlord, forgotPasswordLandlord, resetPasswordLandlord } = require('../controllers/landlordController');
const {updateUserProfile, updateAvatar, getUserProfile} = require('../controllers/landlordUpdate');
const { updateElectricityStatus } = require('../controllers/LandlordRelayToggle');
const authMiddleware = require('../middleware/authMiddleware');




const router = express.Router();
const { limits } = require('../../utils/rateLimit');

router.post('/landlordSignup', limits.signup, registerLandlord);
router.post('/landlordLogin', limits.login, loginLandlord);
router.post('/forgotPasswordLandlord', limits.forgotPassword, forgotPasswordLandlord);
router.post('/resetPasswordLandlord', limits.resetPassword, resetPasswordLandlord);
router.post('/updateLandlord', authMiddleware, updateUserProfile);
router.get('/getProfileLandlord', authMiddleware, getUserProfile);  //get user profile
router.post('/landlordAvatar', authMiddleware, updateAvatar);  // set or remove profile photo


router.post('/updateElectricityStatus', authMiddleware, updateElectricityStatus);


router.get('/landlordIsAuthenticated', (req, res) => {
    if (req.session.landlord) {
        const { password, ...landlord } = req.session.landlord; // never send the password hash
        res.status(200).json({ isAuthenticated: true, landlord });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
    });

router.post('/landlordLogout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
        return res.status(500).json({ msg: 'Logout failed' });
        }
        res.status(200).json({ msg: 'Logout successful' });
    });
});

module.exports = router;

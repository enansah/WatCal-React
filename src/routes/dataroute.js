// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');


router.delete('/deleteRoomHistory/:roomNumber/:month/:year', authMiddleware, dataController.deleteRoomHistory);
router.get('/totalReadingCost/:month/:year', authMiddleware, dataController.getTotalReadingAndCost);



module.exports = router;
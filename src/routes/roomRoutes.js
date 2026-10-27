// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/rooms', authMiddleware, roomController.getRooms);
router.get('/rooms/:id', authMiddleware, roomController.getRoomById);
router.get('/totalReadingAndCost', authMiddleware, roomController.getTotalReadingAndCost);
router.get('/landlordInsights', authMiddleware, roomController.getInsights); // Dashboard + Analysis figures and tips
router.post('/roomMeter', authMiddleware, roomController.setRoomMeter);       // link a meter to a room
router.delete('/room/:roomNumber', authMiddleware, roomController.deleteRoom);


module.exports = router;
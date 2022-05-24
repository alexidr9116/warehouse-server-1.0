const express = require("express");
const router = express.Router();
const NotificationController = require('../../controller/NotificationController');
const auth = require("../../middleware/auth");

router.get('/received',auth,NotificationController.getNotifications);
router.put('/read',auth,NotificationController.readNotification);
router.delete('/delete/:id',auth,NotificationController.deleteNotification);
module.exports = router;
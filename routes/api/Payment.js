const express = require("express");
const router = express.Router();
const PaymentController=require('../../controller/PaymentController');

router.post('/ebarimt',PaymentController.getEbarimt);
router.get('/history/:invoice',PaymentController.getHistoryByInvoice)
module.exports = router;
const express = require("express");
const router = express.Router();
const PaymentController=require('../../controller/PaymentController');
const ProductController = require('../../controller/ProductionController');
const auth = require("../../middleware/auth");
const admin = require('../../middleware/admin');

router.post('/ebarimt',PaymentController.getEbarimt);
router.post('/invoice/self',auth, PaymentController.getInvoiceListBySelf)
router.get('/histories', auth, admin, ProductController.getPayHistories),
module.exports = router;
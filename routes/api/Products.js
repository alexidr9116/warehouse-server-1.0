const express = require("express");
const router = express.Router();
const ProductController = require('../../controller/ProductionController');
const auth = require("../../middleware/auth");
const { imageUpload } = require("../../utils/FileUploader");
const validator = require("../../validation");
 
router.get(
    '/list/:mobile',
    auth,
    ProductController.gets
)  
router.post(
    '/set-delivery-type',
    auth,
    ProductController.setDeliveryType
);
router.get(
    '/delivery-list/:mobile',
    auth,
    ProductController.getsOfDelivery
)  
router.post(
    '/get-by-barcode',
    auth,
    ProductController.getProductByBarcode
)  

router.post(
    '/pay',
    auth,
    ProductController.pay
)
router.post(
    '/pay-with-bank',
    auth,
    ProductController.payWithBank,
)


module.exports = router;
const express = require("express");
const router = express.Router();
const ReviewController = require('../../controller/ReviewController');
const auth = require("../../middleware/auth");
const { imageUpload } = require("../../utils/FileUploader");
const validator = require("../../validation");

router.put(
    '/write',
    auth,
    ReviewController.write,
)
router.get(
    '/top-warehouses',
    
    ReviewController.getTopWarehouse,
)  
router.get(
    '/latest',
    ReviewController.latest,
)  
router.get(
    '/product/:reviewId',
    ReviewController.getProductReviewDetail,
)  
router.get(
    '/detail/:warehouseId',
    ReviewController.getWarehouseDetails,
)  
module.exports = router;
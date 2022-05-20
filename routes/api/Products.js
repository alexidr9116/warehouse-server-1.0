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
    '/buy',
    ProductController.buy
)

router.post(
    '/take',
    ProductController.take
)
module.exports = router;
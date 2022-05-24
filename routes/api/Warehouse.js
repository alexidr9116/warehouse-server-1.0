const express = require("express");
const router = express.Router();
const WarehouseController = require('../../controller/WarehouseController');
const auth = require("../../middleware/auth");
const { imageUpload } = require("../../utils/FileUploader");
const validator = require("../../validation");

router.get(
    '/self',
    auth,
    WarehouseController.getSelf
)
router.get(
    '/rank',
    WarehouseController.getWarehousesByRanking
)  
module.exports = router;
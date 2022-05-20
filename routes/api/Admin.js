const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const UserController = require('../../controller/UserController');
const ProductController = require('../../controller/ProductionController');
const WarehouseController = require('../../controller/WarehouseController');
const DashboardController = require('../../controller/DashboardController');
const { imageUpload } = require("../../utils/FileUploader");
const validator = require("../../validation");

router.delete(
    '/warehouse/delete/:id',
    auth,
    admin,
    WarehouseController.remove
)
router.put(
    '/warehouse/add',
    auth,
    admin,
    [
        imageUpload.single("img"),
        validator.reqStringValidator('name'),
        
    ],
    WarehouseController.put
)
router.put(
    '/warehouse/edit',
    auth,
    admin,
    [ 
        validator.reqStringValidator('name'),
    ],
    WarehouseController.put
)
router.get('/warehouse/list',
    auth,
    admin,
    WarehouseController.listByAdmin
)
 
router.post('/warehouse/set-owner',
    auth,
    admin,
    WarehouseController.setOwner
)
router.get(
    '/products/list/:warehouseId',
    auth,
    admin,
    ProductController.list
)
router.get(
    '/products/history/:warehouseId',
    auth,
    admin,
    ProductController.history
)
router.delete(
    '/product/delete/:id',
    auth,
    admin,
    ProductController.remove
)
router.post(
    '/product/change-location',
    auth,
    admin,
    [
        validator.reqNumberValidator('position'),
    ],
    ProductController.changeLocation
)
router.post(
    '/product/sms-notify',
    auth,
    admin,
    [
        validator.reqNumberValidator('position'),
    ],
    ProductController.sendSmsNotification
)
router.put(
    '/product/edit',
    auth,
    admin,
    [
        validator.reqStringValidator('barcode'),
        validator.reqStringValidator('warehouseId'),
        validator.reqNumberValidator('mobile'),
        validator.reqNumberValidator('price'),
        validator.reqNumberValidator('weight'),
    ],
    ProductController.put
)
router.post(
    '/admin-management',
    auth,
    admin,
    UserController.adminList
);
router.post(
    '/user-management',
    auth,
    admin,
    UserController.userList
);

router.post(
    '/user/change-active',
    auth,
    admin,
    UserController.changeActive
);
router.delete(
    '/user/remove/:id',
    auth,
    admin,
    UserController.remove
);

router.post(
    '/dashboard/system',
    auth,
    DashboardController.getSystemVendorDetails
)

router.post(
    '/dashboard/sent',
    auth,
    DashboardController.getSentChartDetails
)

router.post(
    '/dashboard/receive',
    auth,
    DashboardController.getReceiveChartDetails
)

module.exports = router;
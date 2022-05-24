const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const staff = require('../../middleware/staff');
const UserController = require('../../controller/UserController');
const ProductController = require('../../controller/ProductionController');
const ReviewController = require('../../controller/ReviewController');
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
router.post('/review/delete',auth,admin,ReviewController.deleteReview);
router.post('/review/delete-and-block',auth,admin,ReviewController.deleteReviewAndBlock);
router.post('/payment/confirm',auth,admin,ProductController.confirmPayment);
router.put("/bank/edit",
    auth,
    [
        validator.reqStringValidator('bankName'),
        validator.reqStringValidator('bankAccountName'),
        validator.reqNumberValidator('bankAccountNumber'),
    ],
    UserController.putBank
)

router.put("/bank/add",
    auth,
    [
        imageUpload.single("bankQr"),
        validator.reqStringValidator('bankName'),
        validator.reqStringValidator('bankAccountName'),
        validator.reqNumberValidator('bankAccountNumber'),
    ],
    UserController.putBank
)
router.get(
    '/staff-products/list/:warehouseId',
    auth,
    staff,
    ProductController.staffList
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
router.get('/warehouse/reviews/:warehouseId',
    auth,
    admin,
    ReviewController.getWarehouseReviews
)
router.get('/review/reported', 
    auth, 
    admin, 
    ReviewController.getReportedReviews
)
router.post('/review/report',
    auth,
    admin,
    ReviewController.reportReview
)
router.delete(
    '/product/delete/:id',
    auth,
    admin,
    ProductController.remove
)
router.post('/product/removeMany',auth,admin,ProductController.removeMany);
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
    '/product/arrived-ub',
    auth,
    staff,
    [
        validator.reqStringValidator('barcode'),
        validator.reqStringValidator('warehouseId'),
        validator.reqNumberValidator('price'),
        validator.reqNumberValidator('mobile'),
    ],
    ProductController.arrivedUb
)
router.put(
    '/product/left-china',
    auth,
    staff,
    [
        validator.reqStringValidator('barcode'),
        validator.reqStringValidator('warehouseId'),
        validator.reqNumberValidator('priceY'),
        validator.reqNumberValidator('weight'),
        validator.reqNumberValidator('size'),
    ],
    ProductController.leftFromChina
)
router.put(
    '/product/edit',
    auth,
    staff,
    [
        validator.reqStringValidator('barcode'),
        validator.reqStringValidator('warehouseId'),
        // validator.reqNumberValidator('mobile'),
        // validator.reqNumberValidator('price'),
        // validator.reqNumberValidator('weight'),
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
    '/user/switch-admin',
    auth,
    admin,
    UserController.switchAdminAndUser
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
    DashboardController.getSystemInformation
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
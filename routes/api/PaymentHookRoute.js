const express = require("express");
const router = express.Router();
const PayHistory = require('../../models/PayHistoryModel');

const ResponseData = require("../../utils/ResponseData");
const auth = require("../../middleware/auth");
const ObjectId = require('mongoose').Types.ObjectId;
const { sendPassword } = require("../../utils/Channel");
const ProductModel = require("../../models/ProductModel");

router.get(
    '/qpay/:invoice/:warehouseId',
    async (req, res) => {
        console.log(req.params, " is payment hook");
        try {
            const { invoice, warehouseId } = req.params;
            // change log status to paid
            const history =
                await PayHistory.findOne(
                    {
                        invoice, warehouseId
                    }
                );
            history.status = "paid";
            history.payMethods = "qpay";
            history.updated = Date.now();
            await history.save();

            await ProductModel.updateMany({ _id: { $in: history.productIds } }, { payStatus: "paid", payMethods: "qpay" });


            const notification = new NotificationModel();
            notification.sender = history.payer;
            notification.receiver = history.receiver;
            notification.content = `Hi, there!, I have paid with qpay for ${history.products.length} counts production includes ${history.products[0].barcode}, you can check invoice  ${history.realInvoice} `;
            notification.addition = "";
            notification.productIds = history.productIds;
            notification.products = history.products;

            notification.type = "payment";
            await notification.save();


            console.log("QPayment system was successfully done")
        } catch (err) {
            console.log(err, " is payment hook  error");
        }
        res.status(200).json({ success: true });
    }
)

router.post('/result', auth, async (req, res) => {

    const { invoice } = req.body;
    const sender = req.user._id;
    try {
        const box = await boxModel.aggregate([
            { $match: { invoice, saver: sender } },
            {
                $lookup: {
                    from: "cabinets",
                    localField: "cabinet",
                    foreignField: "_id",
                    as: "cabinetAddress"
                }
            },
            { $unwind: "$cabinetAddress" }
        ]);
        console.log(box, " is payment result box");
        const log = await logModel.findOne({ invoice, saver: sender });
        if (box != null && box.length > 0 && log != null) {
            return ResponseData.ok(res, "", { box: box[0] })
        } else {
            return ResponseData.error(res, `Can not find any data with invoice name INV-${invoice}`);
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res, 'Server Error', { err });
    }
});

module.exports = router;
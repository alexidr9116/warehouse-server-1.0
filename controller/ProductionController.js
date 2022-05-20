const { validationResult } = require("express-validator");
const ResponseData = require("../utils/ResponseData");
const ReviewModel = require("../models/ReviewModel");
const ProductModel = require('../models/ProductModel');
const { QPay } = require("./PaymentController");
const { decryptWithAES } = require("../utils/AESTextEnDecrypt");
const PayHistoryModel = require("../models/PayHistoryModel");
const ProductHistoryModel = require('../models/ProductHistoryModel');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require("../models/UserModel");
const { sendSms, sendMqtt } = require("../utils/Channel");

// change location
const changeLocation = async (req, res) => {
    try {
       
        for(const id of req.body.selected){
            const product = await ProductModel.findById(id);
            await product.updateOne({ position: req.body.position });
            const history = new ProductHistoryModel();
            history.warehouseId = product.warehouseId;
            history.mobile = product.mobile;
            history.barcode = product.barcode;
            history.productId = new ObjectId(id);
            history.operation = "location";
            history.result = "success";
            history.value = req.body.position;
            history.operator = new ObjectId(req.user._id);
           
            await history.save();
        } 
        
        ResponseData.ok(res, "Changed position of products")
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Server Error",);
    }
}
// send sms
const sendSmsNotification = async (req, res) => {
    try {
        let sent = 0, failed = 0;
        for(const id of req.body.selected){
            const product = await ProductModel.findById(id);
            const sms = {
                sms: `Hi, your production [${product.barcode}] 's location was changed to ${req.body.position}. Please check. Regards. From warehouse system`,
                mobile: product.mobile,
            }
            const smsResult = await sendSms(sms);
           
            let success = "wait";
            if (smsResult != null && !smsResult.includes('FAIL')) {
                sent ++;
                success = "success";
            }
            else {
                failed++;
                success = "failed";
            }
            if (req.body.position == "coming") {
                await product.updateOne({ chinaSms: smsResult });
            }
            else if (req.body.position == "ub") {
                await product.updateOne({ ubSms: smsResult });
            }

            const history = new ProductHistoryModel();
            history.warehouseId = product.warehouseId;
            history.mobile = product.mobile;
            history.barcode = product.barcode;
            history.productId = new ObjectId(id);
            history.operation = "sms";
            history.result = success;
            history.value = req.body.position;
            history.operator = new ObjectId(req.user._id);
            await history.save();
        };
        ResponseData.ok(res, `Send SMS & Saved Log, Sent:${sent}, Failed:${failed}`);
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Server Error",);
    }

}

// remove product
const remove = async (req, res) => {
    try {
        await ProductModel.findByIdAndDelete(req.params.id);
        return ResponseData.ok(res, "Removed successful");
    } catch (err) {
        console.log(err)
        return ResponseData.ok(res, `Can not remove ${req.params.id}`);
    }
}
// add or edit product
const put = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        let instance = null;
        const { barcode, mobile, weight, price, comment, title, size, type, id, warehouseId } = req.body;
        if (id && id != "") {
            instance = await ProductModel.findOne({ _id: ObjectId(id) });
        } else {
            instance = await ProductModel.findOne({ barcode, warehouseId: ObjectId(warehouseId) });
            if (instance != null) {
                return ResponseData.error(res, `${barcode} is already registered`);
            }
            instance = new ProductModel();
        }
        if (req.file)
            instance.img = req.file.path;

        instance.barcode = barcode;
        instance.mobile = mobile;
        instance.weight = weight;
        instance.price = price;
        instance.title = title;
        instance.size = size;
        instance.type = type;
        instance.comment = comment;
        instance.warehouseId = new ObjectId(warehouseId);

        await instance.save();
        return ResponseData.ok(res, "Saved Product successful", { product: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save product", { err });
    }

}

// get list (admin)
const list = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }

    const data = await ProductModel.find({ warehouseId: ObjectId(req.params.warehouseId) }).sort({ registeredAt: 1 });
    return ResponseData.ok(res, "", { data });
}

// get list (user)
const gets = async(req,res)=>{
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const reviews = await ReviewModel.find({ writer: ObjectId(req.user._id)});
    const data = await ProductModel.aggregate([
        {$match:{mobile:parseInt(req.params.mobile)}},
        {$lookup:{from:'warehouses',localField:'warehouseId',foreignField:'_id',as:'warehouse'}},
        {$unwind:"$warehouse"},
        {$sort:{registeredAt:-1}},
    ])
    if(data.length > 0 )
    
        return ResponseData.ok(res, "", { data, reviews });
    else{
        return ResponseData.error(res, "No data display" );
    }
}
// get history 
const history = async(req,res)=>{
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    await ProductHistoryModel.find({}).updateMany({warehouseId:ObjectId(req.params.warehouseId)});
    const data = await ProductHistoryModel.find({ warehouseId: ObjectId(req.params.warehouseId) }).sort({ timestamp: -1 });
    return ResponseData.ok(res, "", { data });
}
// buy and get invoice id
const buy = async (req, res) => {
    try {
        const { vendorId, cost, index, title, productId } = req.body;
        const vendor = await VendorModel.findOne({ vendorId });
        if (vendor != null) {
            const receiver = await User.findOne({ _id: vendor.owner });
            if (receiver != null && receiver.status == "active") {

                const { payUsername, payPassword, invoiceAlias, payPassphrase, mobile } = receiver;
                if (payUsername == "" || invoiceAlias == "") {
                    return ResponseData.error(res, "Receiver has not qpay information.");
                } else {
                    const token = await QPay().getAuthToken(payUsername, decryptWithAES(payPassword, payPassphrase));
                    const invoice_number = Date.now();
                    if (token == null) {
                        return ResponseData.error(res, "Can not get Auth token.");
                    } else {
                        const lines = [{
                            line_description: `Order No ${invoice_number} with ${cost}`,
                            line_quantity: 1.00,
                            line_unit_price: cost,
                            taxes: [{
                                tax_code: "VAT",
                                description: "ebarimt",
                                amount: 0,
                                note: "ebarimt"
                            }]
                        }]
                        const invoice = {
                            invoice_code: (invoiceAlias || 'ELEC_MN_INVOICE'),
                            sender_invoice_no: `INV-${invoice_number}`,
                            invoice_receiver_code: `REC-${mobile}-${invoice_number}`,
                            invoice_description: `Payment fee for use ${vendorId}/${index}`,
                            sender_branch_code: vendorId,
                            amount: cost,
                            callback_url: `${process.env.HOST_PAYMENT_HOOK_URL}/INV-${invoice_number}/${productId}`,
                            lines,

                        }
                        // console.log(invoice);
                        const bankList = await QPay().payWithToken(invoice, token);
                        if (bankList != null) {
                            const payHistory = new PayHistoryModel();
                            payHistory.vendorId = vendorId;
                            payHistory.productName = title;
                            payHistory.cost = cost;
                            payHistory.invoice = invoice.sender_invoice_no;
                            payHistory.realInvoice = bankList.invoice_id;
                            payHistory.receiver = vendor.owner;
                            payHistory.productId = ObjectId(productId);
                            if (req.user)
                                payHistory.payer = (req.user._id);
                            await payHistory.save();
                            return ResponseData.ok(res, "Saved invoice successful", { bankList });
                        } else {
                            return ResponseData.error(res, "Failed to create invoice");
                        }
                    }
                }
            } else {
                return ResponseData.error(res, "Can not find Receiver Information.");
            }
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res, "Server error", { err });
    }

}
// take goods using sms or 4g
const take = async (req, res) => {
    const { type, productId, vendorId, slotId, realInvoice, deviceNumber } = req.body;
    try {
        if (type == "ble") {
            await ProductModel.findByIdAndUpdate(productId, { status: 0 });
            await PayHistoryModel.findOneAndUpdate({ realInvoice }, { taken: 1 });
            ResponseData.ok(res, "Please wait while processing");
        }
        if (type == "sms") {
            const params = {
                mobile: deviceNumber,
                sms: slotId,
            }
            const response = await sendSms(params, {}, res);
            console.log(response);
            if (response != null && response.data) {
                await ProductModel.findByIdAndUpdate(productId, { status: 0 });
                await PayHistoryModel.findOneAndUpdate({ realInvoice }, { taken: 1 });
                ResponseData.ok(res, "Please wait while processing");
            } else {
                ResponseData.error(res, "Whoops, Didn't send sms, Try again");
            }
        }
        // if (type == "wifi") {
        //     const params = {
        //         "topic": "gps/command",
        //         "payload": {
        //             "id": vendorId,
        //             "command": slotId
        //         },
        //         "qos": 0,
        //         "retain": false,
        //         "clientid": vendorId
        //     }
        //     const options = {
        //         auth: {
        //             username: process.env.MQTT_USER_NAME,
        //             password: process.env.MQTT_USER_PWD,
        //         }

        //     }
        //     const response = await sendMqtt(params, options, res);
        //     console.log(response);
        //     if (response != null && response.data) {
        //         await ProductModel.findByIdAndUpdate(productId, { status: 0 });
        //         await PayHistoryModel.findOneAndUpdate({ realInvoice }, { taken: 1 });
        //         ResponseData.ok(res, "Please wait while processing with wi-fi");
        //     } else {
        //         ResponseData.error(res, "Whoops, Didn't send over wi-fi, Try again");
        //     }
        // }
        if (type == "4g" || type == "wifi") {
            const params = {
                "topic": vendorId,
                "payload": {
                    "id": vendorId,
                    "command": slotId
                },
                "qos": 0,
                "retain": false,
                "clientid": vendorId
            }
            const options = {
                auth: {
                    username: process.env.MQTT_USER_NAME,
                    password: process.env.MQTT_USER_PWD,
                }

            }
            const response = await sendMqtt(params, options, res);
            console.log(response);
            if (response != null && response.data) {
                await ProductModel.findByIdAndUpdate(productId, { status: 0 });
                await PayHistoryModel.findOneAndUpdate({ realInvoice }, { taken: 1 });
                ResponseData.ok(res, "Please wait while processing with 4g");
            } else {
                ResponseData.error(res, "Whoops, Didn't send over mtqq, Try again");
            }
        }
    } catch (err) {
        console.log(err)
        ResponseData.error(res, "Server Error");
    }
}

module.exports = {
    list,
    put,
    buy,
    remove,
    take,
    changeLocation,
    sendSmsNotification,
    history,
    gets

}
const { validationResult } = require("express-validator");
const ResponseData = require("../utils/ResponseData");
const ReviewModel = require("../models/ReviewModel");
const ProductModel = require('../models/ProductModel');
const WarehouseModel = require('../models/WarehouseModel');
const { QPay } = require("./PaymentController");
const { decryptWithAES } = require("../utils/AESTextEnDecrypt");
const PayHistoryModel = require("../models/PayHistoryModel");
const ProductHistoryModel = require('../models/ProductHistoryModel');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require("../models/UserModel");
const { sendSms, sendMqtt } = require("../utils/Channel");
const NotificationModel = require("../models/NotificationModel");

// change location
const changeLocation = async (req, res) => {
    try {
        const location = req.body.position;

        for (const id of req.body.selected) {
            const product = await ProductModel.findById(id);
            if (location == "remove" && product.payStatus == "unpaid") {
                await product.deleteOne();
            }
            // if (location.includes('paid')) {
            //     warehouseId = product.warehouseId;
            //     products.push({
            //         id: product._id,
            //         barcode: product.barcode,
            //         cost: product.price,
            //         mobile: product.mobile,
            //         productName: product.title,
            //     });
            //     productIds.push(ObjectId(id));
            //     totalCost += product.price;
            //     await product.updateOne({ payStatus: location, payMethods: 'manually' })

            // }
            else if (location != 'remove') {
                await product.updateOne({ position: req.body.position });
                const history = new ProductHistoryModel();
                history.warehouseId = product.warehouseId;
                history.mobile = product.mobile;
                history.barcode = product.barcode;
                history.productId = new ObjectId(id);
                history.operation = "location";
                history.value = location;
                history.result = "success";
                history.operator = new ObjectId(req.user._id);
                await history.save();
            }
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
        let users = [];
        for (const id of req.body.selected) {
            const product = await ProductModel.findById(id);
            if (product != null && product.mobile && product.mobile >0) {

                const owner = await User.findOne({ mobile: `${product.mobile}` });
                const filter = users.filter(u => { console.log(u.mobile == owner.mobile); return (u.mobile == owner.mobile) });
                // console.log(filter);
                if (filter.length == 0) {

                    owner.products = [];
                    owner.products.push(product);
                    users.push(owner);
                    // console.log(users);
                }
                else {
                    const _owner = users.filter(u => (u.mobile == owner.mobile))[0];
                    _owner.products.push(product);
                }

            }
        }
        // console.log(users);
        for(const user of users){

            const sms = {
                sms: `Hi, ${user.firstName} ${user.lastName} - ${user.mobile}, production's status of ${user.products.length} counts changed to ${req.body.position}`,
                mobile: user.mobile,
            }
            const smsResult = await sendSms(sms);

            let success = "wait";
            if (smsResult != null && !smsResult.includes('FAIL')) {
                sent++;
                success = "success";
            }
            else {
                failed++;
                success = "failed";
            }
            // if (req.body.position == "coming") {
            //     await product.updateOne({ chinaSms: smsResult });
            // }
            // else if (req.body.position == "ub") {
            //     await product.updateOne({ ubSms: smsResult });
            // }

            const warehouse = WarehouseModel.findOne({owner:req.user._id});
            if(warehouse!= null){
                const notification = new NotificationModel();
                notification.sender = req.user._id;
                notification.receiver = user._id;
                notification.content = sms.sms;
                notification.addition =  smsResult;
                notification.productIds = [];
                notification.products = [];
                for(const p of user.products){
                    notification.productIds.push(p._id);
                    notification.products.push({id:p._id,cost:p.totalCost,barcode:p.barcode,productName:p.name,mobile:p.mobile});
                }
                notification.type = "sms";
                await notification.save();
            }
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
// remove Products

const removeMany = async (req, res) => {
    try {
        let removed = 0;
        for (const id of req.body.checked) {
            const product = await ProductModel.findById(id);
            if (product != null && product.payStatus === "unpaid") {
                await product.deleteOne();
                removed++;
            }
        }
        return ResponseData.ok(res, "Removed successful", { removed });
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
        const { barcode, mobile, weight, price, comment, title, size, type, id, warehouseId, priceY } = req.body;
        if (id && id != "") {
            instance = await ProductModel.findOne({ _id: ObjectId(id) });
        } else {
            instance = await ProductModel.findOne({ barcode, warehouseId: ObjectId(warehouseId) });
            if (instance != null) {
                return ResponseData.error(res, `${barcode} is already registered`);
            }
            instance = new ProductModel();
        }
        // if (req.file)
        //     instance.img = req.file.path;

        instance.barcode = barcode;
        instance.mobile = mobile;
        instance.weight = weight;
        // instance.price = price;
        if (priceY) {
            instance.priceY = priceY;
            const warehouse = await WarehouseModel.findOne({ owner: req.user._id });
            if (warehouse != null && warehouse.increaseRate && warehouse.increaseIndex) {
                const index = warehouse.increaseIndex;
                const rates = warehouse.increaseRate;
                console.log(index);
                const mntPrice = priceY * 460;
                if (index == 0) {
                    instance.price = mntPrice;
                    instance.totalCost = mntPrice;
                }
                else if (index == 1) {
                    instance.price = (mntPrice + rates[index] * mntPrice / 100);
                    instance.totalCost = instance.price;
                }
                else if (index == 2 && instance.weight && instance.weight > 0) {
                    instance.price = (mntPrice + rates[index] * instance.weight);
                    instance.totalCost = instance.price;
                }
                else if (index == 3 && instance.size && instance.size > 0) {
                    instance.price = (mntPrice + rates[index] * instance.size);
                    instance.totalCost = instance.price;
                }
            }
        }
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
// add or edit product
const leftFromChina = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        let instance = null;
        const { barcode, mobile, weight, comment, title, size, type, id, warehouseId, priceY } = req.body;
        if (id && id != "") {
            instance = await ProductModel.findOne({ _id: ObjectId(id) });
        } else {
            instance = await ProductModel.findOne({ barcode, warehouseId: ObjectId(warehouseId), position:"china" });
            if (instance == null) {
                return ResponseData.error(res, `Oops, ${barcode} is not registered or already left from China`);
            }
        }
        // if (req.file)
        //     instance.img = req.file.path;

        // instance.barcode = barcode;
        if (mobile)
            instance.mobile = mobile;
        if (weight)
            instance.weight = weight;
        if (priceY) {
            instance.priceY = priceY;

            const warehouse = await WarehouseModel.findOne({ owner: req.user._id });
            if (warehouse != null && warehouse.increaseRate && warehouse.increaseIndex) {
                const index = warehouse.increaseIndex;
                const rates = warehouse.increaseRate;
                const mntPrice = priceY * 460;
                if (index == 0) {
                    instance.price = mntPrice;
                    instance.totalCost = mntPrice;
                }
                else if (index == 1) {
                    instance.price = (mntPrice + rates[index] * mntPrice / 100);
                    instance.totalCost = instance.price;
                }
                else if (index == 2 && instance.weight && instance.weight > 0) {
                    instance.price = (mntPrice + rates[index] * instance.weight);
                    instance.totalCost = instance.price;
                }
                else if (index == 3 && instance.size && instance.size > 0) {
                    instance.price = (mntPrice + rates[index] * instance.size);
                    instance.totalCost = instance.price;
                }
            }
        }
        // instance.price = price;
        // instance.totalCost = price;
        if (title)
            instance.title = title;
        if (size)
            instance.size = size;
        if (type)
            instance.type = type;
        if (comment)
            instance.comment = comment;

        instance.position = "coming";
        instance.leftAt = Date.now();
        //  instance.warehouseId = new ObjectId(warehouseId);

        await instance.save();
        return ResponseData.ok(res, `${barcode}  left from China`, { product: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save product", { err });
    }

}

const getProductByBarcode = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {
        return ResponseData.error(res, result.array()[0].msg);
    }
    try {

        const { barcode, warehouseId } = req.body;
        const instance = await ProductModel.findOne({ barcode, warehouseId: ObjectId(warehouseId) });
        if (instance == null) {
            return ResponseData.error(res, `Oops, ${barcode} is not registered`);
        }
        else {
            return ResponseData.ok(res, ``, { product: instance });
        }

    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, `Server Error`, { err });
    }
}
const arrivedUb = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        
        const { barcode, mobile, weight, comment, title, size, type, id, warehouseId, price } = req.body;
        const instance = await ProductModel.findOne({ barcode, warehouseId: ObjectId(warehouseId), $or: [{ position: 'china' }, { position: 'coming' }]});
        if (instance == null) {
            return ResponseData.error(res, `Oops, ${barcode} is not registered or already arrived`);
        }
        // if (req.file)
        //     instance.img = req.file.path;
        // instance.barcode = barcode;
        if (mobile)
            instance.mobile = mobile;
        // if (weight)
        //     instance.weight = weight;
        if (price) {
            instance.price = price;
            instance.totalCost = price;
        }
         
        if (title)
            instance.title = title;
        // if (size)
        //     instance.size = size;
        if (type)
            instance.type = type;
        if (comment)
            instance.comment = comment;

        instance.position = "ub";
        //  instance.warehouseId = new ObjectId(warehouseId);

        await instance.save();
        return ResponseData.ok(res, `${barcode}  Arrived Ulaanbaatar`, { product: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save product", { err });
    }

}


// get list (staff)
const staffList = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const data = await ProductModel.find({$or:[{position:"china"},{position:"coming"}] , warehouseId: ObjectId(req.params.warehouseId) }).sort({ registeredAt: 1 });
    return ResponseData.ok(res, "", { data });
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
const gets = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const reviews = await ReviewModel.find({ writer: ObjectId(req.user._id) });
    const data = await ProductModel.aggregate([
        { $match: { mobile: parseInt(req.params.mobile) } },
        { $lookup: { from: 'warehouses', localField: 'warehouseId', foreignField: '_id', as: 'warehouse' } },
        { $unwind: "$warehouse" },
        { $lookup: { from: 'users', localField: 'warehouse.owner', foreignField: "_id", as: 'owner' } },
        { $unwind: "$owner" },
        { $sort: { registeredAt: -1 } },
    ]);

    if (data.length > 0)

        return ResponseData.ok(res, "", { data, reviews });
    else {
        return ResponseData.error(res, "No data display");
    }
}
const setDeliveryType = async (req, res) => {
    try {
        const data = req.body.data;

        for (const row of data) {

            const product = await ProductModel.findById(row.id);
            product.deliveryType = row.deliveryType;
            product.deliveryCost = row.deliveryCost;
            product.totalCost = (product.price + row.deliveryCost);

            await product.save();

        }
        return ResponseData.ok(res, "Updated successfully");
    }
    catch (err) {
        console.log(err);
    }
}
const getsOfDelivery = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const reviews = await ReviewModel.find({ writer: ObjectId(req.user._id) });
    const data = await ProductModel.aggregate([
        { $match: { $or: [{ position: 'ub' }, { position: 'coming' }], price:{$gt:0}, payStatus: "unpaid", mobile: parseInt(req.params.mobile) } },
        { $lookup: { from: 'warehouses', localField: 'warehouseId', foreignField: '_id', as: 'warehouse' } },
        { $unwind: "$warehouse" },
        { $sort: { registeredAt: -1 } },
    ])
    if (data.length > 0)

        return ResponseData.ok(res, "", { data, reviews });
    else {
        return ResponseData.error(res, "No data display");
    }
}
// get history 
const history = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const data = await ProductHistoryModel.find({ warehouseId: ObjectId(req.params.warehouseId) }).sort({ timestamp: -1 });
    return ResponseData.ok(res, "", { data });
}
// pay and get invoice id
const pay = async (req, res) => {
    try {
        const { warehouseId, productIds } = req.body;
        const warehouse = await WarehouseModel.findById(warehouseId);
        let productObjectIds = [];
        for (const id of productIds) {
            productObjectIds.push(ObjectId(id));
        }
        if (warehouse != null) {
            const products = await ProductModel.find({ _id: { $in: productObjectIds } });
            const cost = products.reduce((prev, current) => (prev + current.totalCost), 0);

            const receiver = await User.findOne({ _id: warehouse.owner });
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
                            invoice_description: `Payment fee for use ${warehouseId}`,
                            sender_branch_code: warehouseId,
                            amount: cost,
                            callback_url: `${process.env.HOST_PAYMENT_HOOK_URL}/INV-${invoice_number}/${warehouseId}`,
                            lines,

                        }
                        console.log(invoice);
                        const bankList = await QPay().payWithToken(invoice, token);
                        if (bankList != null) {

                            let productsOfHistory = [];
                            let productIdsOfHistory = [];

                            for (const product of products) {
                                productsOfHistory.push({
                                    id: product._id,
                                    barcode: product.barcode,
                                    cost: product.totalCost,
                                    mobile: product.mobile,
                                    productName: product.title,
                                });
                                productIdsOfHistory.push(ObjectId(product._id));
                            }


                            const payHistory = new PayHistoryModel();
                            payHistory.warehouseId = warehouseId;
                            payHistory.productIds = productIdsOfHistory;
                            payHistory.products = productsOfHistory;

                            payHistory.totalCost = cost;
                            payHistory.invoice = invoice.sender_invoice_no;
                            payHistory.realInvoice = bankList.invoice_id;
                            payHistory.receiver = warehouse.owner;

                            payHistory.payMethods = "qpay";
                            payHistory.status = "unpaid";
                            payHistory.payer = (req.user._id);
                            // payHistory.payer = (req.user._id);
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
        else {
            return ResponseData.error(res, "Can not find warehouse");
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res, "Server error", { err });
    }

}
// pay with manually
const payWithBank = async (req, res) => {
    try {
        const { warehouseId, productIds } = req.body;
        const warehouse = await WarehouseModel.findById(warehouseId);
        let productObjectIds = [];
        for (const id of productIds) {
            productObjectIds.push(ObjectId(id));
        }
        if (warehouse != null) {
            const products = await ProductModel.find({ _id: { $in: productObjectIds } });
            const cost = products.reduce((prev, current) => (prev + current.totalCost), 0);

            const receiver = await User.findOne({ _id: warehouse.owner });
            if (receiver != null && receiver.status == "active") {

                const { bankName, bankAccountName, bankAccountNumber } = receiver.bank;
                if (bankName == "" || bankAccountName == "") {
                    return ResponseData.error(res, "Receiver has not bank information.");
                } else {

                    let productsOfHistory = [];
                    let productIdsOfHistory = [];

                    for (const product of products) {
                        productsOfHistory.push({
                            id: product._id,
                            barcode: product.barcode,
                            cost: product.totalCost,
                            mobile: product.mobile,
                            productName: product.title,
                        });
                        productIdsOfHistory.push(ObjectId(product._id));

                        await product.updateOne({ payStatus: "inprogress", payMethods: "manually" });
                    }

                    const payHistory = new PayHistoryModel();
                    payHistory.warehouseId = warehouseId;
                    payHistory.productIds = productIdsOfHistory;
                    payHistory.products = productsOfHistory;

                    payHistory.totalCost = cost;
                    payHistory.invoice = `MAN-${Date.now()}`;
                    payHistory.realInvoice = `MAN-${Date.now()}`;
                    payHistory.receiver = warehouse.owner;

                    payHistory.payMethods = "manually";
                    payHistory.status = "inprogress";
                    payHistory.payer = (req.user._id);
                    // payHistory.payer = (req.user._id);
                    await payHistory.save();

                    const notification = new NotificationModel();
                    notification.sender = payHistory.payer;
                    notification.receiver = payHistory.receiver;
                    notification.content = `Hi, there!, I have paid with qpay for ${payHistory.products.length} counts production includes ${payHistory.products[0].barcode}, you can check invoice  ${payHistory.realInvoice} `;
                    notification.addition = "";
                    notification.productIds = payHistory.productIds;
                    notification.products = payHistory.products;

                    notification.type = "payment";
                    await notification.save();


                    return ResponseData.ok(res, "Saved invoice successful, Wait for checking admin");
                }
            }
            else {
                return ResponseData.error(res, "Whoops, Account is not visible");
            }
        }
        else {
            return ResponseData.error(res, "Can not find warehouse");
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res, "Server error", { err });
    }

}
// admin get clients pay histories
const getPayHistories = async (req, res) => {
    try {
        const data = await PayHistoryModel.aggregate([
            { $match: { receiver: req.user._id, status: { $ne: "unpaid" } } },
            { $lookup: { from: "users", localField: "payer", foreignField: "_id", as: "payer" } },
            { $unwind: "$payer" },
            { $sort: { created: -1 } }
        ])
        return ResponseData.ok(res, "", { data });
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Server Error", { err });
    }
}
const confirmPayment = async (req, res) => {
    try {
        const { id } = req.body;
        const hs = await PayHistoryModel.findById(id);
        await hs.updateOne({ status: "paid", payMethods: "manually" });
        await ProductModel.find({ _id: { $in: hs.productIds } }).updateMany({ payStatus: "paid", payMethods: "manually" });
        return ResponseData.ok(res, "", {});
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Server Error", { err });
    }
}
module.exports = {
    list,
    staffList,
    put,
    leftFromChina,
    arrivedUb,
    getProductByBarcode,
    pay,
    remove,
    removeMany,
    getsOfDelivery,
    changeLocation,
    sendSmsNotification,
    history,
    setDeliveryType,
    gets,
    payWithBank,
    getPayHistories,
    confirmPayment
}
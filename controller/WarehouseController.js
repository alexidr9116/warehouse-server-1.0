const { validationResult } = require("express-validator");
const ResponseData = require("../utils/ResponseData");
const WarehouseModel = require('../models/WarehouseModel');
const ProductModel = require('../models/ProductModel');
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs')
const path = require('path');
const ReviewModel = require("../models/ReviewModel");

// remove warehouse
const remove = async (req, res) => {
    try {
        await WarehouseModel.findByIdAndDelete(req.params.id);
        return ResponseData.ok(res, "Removed successful");
    }
    catch (err) {
        console.log(err)
        return ResponseData.ok(res, `Can not remove ${req.params.id}`);
    }
}

// add or edit warehouse
const put = async (req, res) => {
    if (req.file) {
        var result = validationResult(req);
        if (!result.isEmpty()) {
            fs.unlink(path.resolve(req.file.path), (err) => { });
            return ResponseData.error(res, result.array()[0].msg);
        }
    }
    try {
        let instance = null;
        if (req.body.id != "add") {
            instance = await WarehouseModel.findOne({ _id: ObjectId(req.body.id) });
        } else {
            instance = new WarehouseModel();
        }
        if (req.file)
            instance.img = req.file.path;
        const { chinaAddress, chinaFrom, chinaTo, chinaTel1, chinaTel2, ubAddress, ubFrom, ubTo, ubTel1, ubTel2, name, openAlways, price, priceY, price1, price1Y, period, haveBusiness, description, payMethods, deliveryCost1, deliveryCost2, deliveryCost3,increaseIndex, rateTotal, rateKg, rateM3 } = req.body;
        instance.china = { address: chinaAddress, from: chinaFrom, to: chinaTo, tel1: chinaTel1, tel2: chinaTel2 };
        instance.ub = { address: ubAddress, from: ubFrom, to: ubTo, tel1: ubTel1, tel2: ubTel2 };
        instance.name = name;
        instance.openAlways = openAlways;
        if (price)
            instance.price = parseFloat(price);
        if (priceY)
            instance.priceY = parseFloat(priceY);
        if (price1)
            instance.price1 = parseFloat(price1);
        if (price1Y)
            instance.price1Y = parseFloat(price1Y);
        if (period)
            instance.period = parseInt(period);
        if (deliveryCost1)
            instance.deliveryCost1 = parseFloat(deliveryCost1);
        if (deliveryCost2)
            instance.deliveryCost2 = parseFloat(deliveryCost2);
        if (deliveryCost3)
            instance.deliveryCost3 = parseFloat(deliveryCost3);
        if(increaseIndex)
            instance.increaseIndex = parseInt(increaseIndex);
        if(rateTotal){
            instance.increaseRate = [0,parseFloat(rateTotal),parseFloat(rateKg),parseFloat(rateM3)];
        }    
        instance.haveBusiness = haveBusiness;
        instance.owner = req.user._id;
        instance.description = description;
        instance.payMethods = payMethods;
        await instance.save();

        return ResponseData.ok(res, "Saved Warehouse setting  successful", { warehouse: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save warehouse setting", { err });
    }

}
const getWarehousesByRanking = async (req, res) => {
    try {

        const reviews = await ReviewModel.aggregate([
            { $group: { _id: "$warehouseId", avg: { $avg: "$rate" }, sum: { $sum: 1 } } },
            { $lookup: { from: 'warehouses', localField: "_id", foreignField: '_id', as: 'warehouse' } },
            { $unwind: "$warehouse" },
            { $sort: { avg: -1 } },
        ])
        if (reviews.length > 0)
            ResponseData.ok(res, "Fetch reviews", { reviews })
        else
            ResponseData.error(res, "Not Fetched reviews")
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Internal Server Error")
    }
}
// get list
const listByAdmin = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const find = req.user.role === "admin" ? { owner: req.user._id } : {};

    const data = await WarehouseModel.find(find);
    return ResponseData.ok(res, "", { data });
}
// set owner
const setOwner = async (req, res) => {
    try {

        const vendor = await WarehouseModel.findById(ObjectId(req.body.id));
        if (vendor != null) {
            vendor.owner = ObjectId(req.body.owner);
            await vendor.save();
            return ResponseData.ok(res, "Changed successful", { vendor });
        } else {
            return ResponseData.error(res, "Can not find the vendor", {});
        }
    } catch (err) {
        console.log(err);
        return ResponseData.err(res, "Server Error", {});
    }

}
// get warehouse detail
const get = async (req, res) => {
    try {
        const data = await WarehouseModel.findById(req.params.id);
        if (data != null)
            return ResponseData.ok(res, "", { data });
        else
            return ResponseData.error(res, "Can not find the mini warehouse by id", {});
    }
    catch (err) {
        console.log(err)
        return Response.error(res, "Server err", { err });
    }
}
// get warehouse by owner
const getSelf = async (req, res) => {
    try {
        const warehouse = await WarehouseModel.findOne({ owner: ObjectId(req.user._id) });
        if (warehouse != null)
            return ResponseData.ok(res, "", { warehouse });
        else
            return ResponseData.error(res, "Can not find the warehouse");
    }
    catch (err) {
        console.log(err)
        return Response.error(res, "Server err", { err });
    }
}
module.exports = {
    listByAdmin,
    put,
    get,
    getSelf,

    remove,
    getWarehousesByRanking
}
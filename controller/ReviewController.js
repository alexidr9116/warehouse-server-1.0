const { validationResult } = require("express-validator");
const ResponseData = require("../utils/ResponseData");
const VendorModel = require('../models/VendModel');
const ProductModel = require('../models/ProductModel');
const { QPay } = require("./PaymentController");
const { decryptWithAES } = require("../utils/AESTextEnDecrypt");
const PayHistoryModel = require("../models/PayHistoryModel");
const ProductHistoryModel = require('../models/ProductHistoryModel');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require("../models/UserModel");
const ReviewModel = require("../models/ReviewModel");

// write review 
const write = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {
        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        let instance = null;
        const { timeRate, brokenRate, priceRate, recommendRate, comment, productId } = req.body;
        const product = await ProductModel.findById(productId);
        instance = new ReviewModel();

        instance.warehouseId = product.warehouseId;
        instance.productId = ObjectId(productId);
        instance.timeRate = timeRate;
        instance.brokenRate = brokenRate;
        instance.priceRate = priceRate;
        instance.recommendRate = recommendRate;
        instance.rate = ((timeRate + brokenRate + priceRate + recommendRate) / 4);
        instance.comment = comment;
        instance.writer = req.user._id;
        await instance.save();
        return ResponseData.ok(res, "Saved Review successful", { review: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save review", { err });
    }
}
// get latest reviews 
const latest = async (req, res) => {
    try {
        const reviews = await ReviewModel.aggregate([
            { $lookup: { from: 'users', localField: 'writer', foreignField: '_id', as: 'writer' } },
            { $lookup: { from: 'warehouses', localField: 'warehouseId', foreignField: '_id', as: 'warehouse' } },
            { $unwind: "$writer" },
            { $unwind: "$warehouse" },
            { $limit: 10 },
        ]);
       
        ResponseData.ok(res, "Fetch reviews", { reviews })
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Can not get latest  reviews");
    }

}
// get product review detail 
const getProductReviewDetail = async(req, res)=>
{
    try{ 
        const reviews = await ReviewModel.aggregate([
            { $match:{_id:ObjectId(req.params.reviewId)}},
            { $lookup: { from: 'users', localField: "writer", foreignField: '_id', as: 'writer' } },
            { $lookup: { from: 'products', localField: "productId", foreignField: '_id', as: 'product' } },
            { $unwind: "$writer" },
            { $unwind: "$product" },
        ]); 
        if (reviews.length > 0)
            ResponseData.ok(res, "Fetch product review", {review: reviews[0] })
        else
            ResponseData.error(res, "Not Fetched product review")
    }
    catch(err){
        console.log(err)
        ResponseData.error(res, "Can not get product review");
    }
}

// get warehouse details
const getWarehouseDetails = async (req, res) => {
    try {

        const reviews = await ReviewModel.aggregate([
            { $group: { _id: "$warehouseId", avg: { $avg: "$rate" }, sum: { $sum: 1 } } },
            { $lookup: { from: 'warehouses', localField: "_id", foreignField: '_id', as: 'warehouse' } },
            { $match:{_id:ObjectId(req.params.warehouseId)}},
            { $unwind: "$warehouse" },
            { $sort: { avg: -1 } },

        ]);
        const detailReviews = await ReviewModel.aggregate([
            { $match:{warehouseId:ObjectId(req.params.warehouseId)}},
            { $lookup: { from: 'users', localField: "writer", foreignField: '_id', as: 'writer' } },
            { $unwind: "$writer" },
            { $sort: { createdAt: -1 } },

        ]);
        if (reviews.length > 0)
            ResponseData.ok(res, "Fetch warehouses", {review: reviews[0],detailReviews })
        else
            ResponseData.error(res, "Not Fetched warehouses")
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Internal Server Error" )
    }
}

// get top rated warehouse
const getTopWarehouse = async (req, res) => {
    try {

        const warehouses = await ReviewModel.aggregate([
            { $group: { _id: "$warehouseId", avg: { $avg: "$rate" }, sum: { $sum: 1 } } },
            { $lookup: { from: 'warehouses', localField: "_id", foreignField: '_id', as: 'warehouse' } },
            { $unwind: "$warehouse" },
            { $sort: { avg: -1 } },

        ])
        if (warehouses.length > 0)
            ResponseData.ok(res, "Fetch warehouses", { warehouses })
        else
            ResponseData.error(res, "Not Fetched warehouses")
    }
    catch (err) {
        console.log(err)
        ResponseData.error(res, "Internal Server Error" )
    }
}
module.exports = {
    write,
    latest,
    getTopWarehouse,
    getWarehouseDetails,
    getProductReviewDetail
}
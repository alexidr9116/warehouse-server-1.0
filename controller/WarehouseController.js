const { validationResult } = require("express-validator");
const ResponseData = require("../utils/ResponseData");
const WarehouseModel = require('../models/WarehouseModel');
const ProductModel = require('../models/ProductModel');
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs')
const path = require('path')

// remove warehouse
const remove = async(req,res)=>{
    try
    {
        await WarehouseModel.findByIdAndDelete(req.params.id);
        return ResponseData.ok(res,"Removed successful");
    }
    catch(err){
        console.log(err)
        return ResponseData.ok(res,`Can not remove ${req.params.id}`);
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
        const {chinaAddress,chinaFrom,chinaTo,chinaTel1,chinaTel2,ubAddress,ubFrom,ubTo,ubTel1, ubTel2, name, openAlways,price,period,haveBusiness,description} = req.body;
        instance.china = {address:chinaAddress,from:chinaFrom,to:chinaTo,tel1:chinaTel1,tel2:chinaTel2};
        instance.ub = {address:ubAddress,from:ubFrom,to:ubTo,tel1:ubTel1,tel2:ubTel2};
        instance.name = name;
        instance.openAlways = openAlways;
        instance.price = price;
        instance.period = period;
        instance.haveBusiness = haveBusiness;
        instance.owner = req.user._id;
        instance.description = description;
        await instance.save();

        return ResponseData.ok(res, "Saved Warehouse setting  successful", { warehouse: instance });
    } catch (err) {
        console.log(err);
        return ResponseData.error(res, "Did not save warehouse setting", { err });
    }

}

// get list
const listByAdmin = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const find = req.user.role === "admin" ? {owner:req.user._id}:{};
    
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
    try{
        const data = await WarehouseModel.findById(req.params.id);
        if (data != null)
            return ResponseData.ok(res, "", { data });
        else
            return ResponseData.error(res, "Can not find the mini vendor by id", {});
    }
    catch(err){
        console.log(err)
        return Response.error(res,"Server err",{err});
    }
}
// get warehouse by owner
const getSelf = async (req, res) => {
    try{
        const warehouse = await WarehouseModel.findOne({owner:ObjectId(req.user._id)});
        if (warehouse != null)
            return ResponseData.ok(res, "", { warehouse });
        else
            return ResponseData.error(res, "Can not find the warehouse");
    }
    catch(err){
        console.log(err)
        return Response.error(res,"Server err",{err});
    }
}
module.exports = {
    listByAdmin,
    put,
    get,
    getSelf,
    setOwner,
    remove,
}
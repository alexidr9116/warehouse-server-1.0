const Warehouse = require('../models/WarehouseModel');
const Products = require('../models/ProductModel');
const PayHistory = require('../models/PayHistoryModel');
const ResponseData = require('../utils/ResponseData');
const Users = require('../models/UserModel');
const NotificationModel = require('../models/NotificationModel');

const readNotification = async(req,res)=>{
    await NotificationModel.findByIdAndUpdate(req.body.id, {read:true});
    return ResponseData.ok(res,"");
}
const deleteNotification = async(req,res)=>{
    await NotificationModel.findByIdAndRemove(req.params.id);
    return ResponseData.ok(res,"");
}
const getNotifications = async(req,res)=>{
    try{
        const notifications = await NotificationModel.aggregate([
            {$match:{receiver:req.user._id}},
            {$lookup:{from:'users',localField:'sender',foreignField:'_id',as:'sender'}},
            {$unwind:"$sender"},
            {$sort:{"sender._id":-1, created:-1}},
        ]);
        return ResponseData.ok(res,"",{notifications});
    }
    catch(err){
        console.log(err);
        return ResponseData.error(res,"Server Error",{err});
    }
    
}
module.exports = {
    getNotifications,
    readNotification,
    deleteNotification
}
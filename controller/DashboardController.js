const Warehouse = require('../models/WarehouseModel');
const Products = require('../models/ProductModel');
const PayHistory = require('../models/PayHistoryModel');
const ResponseData = require('../utils/ResponseData');
const Users = require('../models/UserModel');
const getSystemInformation = async (req, res) => {
    try {
        const warehouse = await Warehouse.findOne({owner:req.user._id});
        
        const allWarehouse = await Warehouse.find({}, { _id: 0, status: -1, name: -1, owner:-1 });
        const $where1 = (warehouse!=null ? ({position:{$ne:"completed"},warehouseId:warehouse._id}):{position:{$ne:"completed"}});
        
        const allProducts = await Products.find($where1, { _id: 0, price: -1, position:-1});

        const allPayHistory = await PayHistory.find({status:"paid"},{_id:-1,invoice:-1, created:-1, totalCost:-1, receiver:-1, payer:-1,realInvoice:-1, payMethods:-1 }).sort({created:'desc'});

        const allUsers = await Users.find({},{_id:0,status:-1});
        return ResponseData.ok(res, "", { allWarehouse, allProducts,allPayHistory,allUsers });
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Can not get system vednors", { err });
    }
}
const getSentChartDetails = async (req, res) => {
    try {
        const months = await PayHistory.aggregate([
            {
                $match:{
                    payer:(req.user._id),
                    status:'paid',
                }
            },
            {
                $addFields: {
                    tsToDate: { $toDate: "$created" }
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: "$tsToDate" } },
                    total: { $sum: "$totalCost" },
                }
            },
            {
                $sort:{_id:1}
            }
        ]
        );
       
        return ResponseData.ok(res, "", { months});
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Can not fetch", {});
    }
}
const getReceiveChartDetails = async (req, res) => {
    try {
        const months = await PayHistory.aggregate([
            {
                $match:{
                    receiver:(req.user._id),
                    status:'paid',
                }
                
            },
            {
                $addFields: {
                    tsToDate: { $toDate: "$created" }
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: "$tsToDate" } },
                    total: { $sum: "$totalCost" },
                }
            },
            {
                $sort:{_id:1}
            }
        ]
        );
        
        return ResponseData.ok(res, "", { months});
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Can not fetch", {});
    }
}

module.exports = {
    getSystemInformation,
    getSentChartDetails,    
    getReceiveChartDetails,
 
}
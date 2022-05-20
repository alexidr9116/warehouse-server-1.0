const Vendor = require('../models/VendModel');
const Products = require('../models/ProductModel');
const PayHistory = require('../models/PayHistoryModel');
const ResponseData = require('../utils/ResponseData');
const getSystemVendorDetails = async (req, res) => {
    try {
        const allVendors = await Vendor.find({}, { _id: 0, status: -1, title: -1, vendorId: -1, owner:-1 });
        const allProducts = await Products.find({}, { _id: 0, status: -1, price: -1});
        const allPayHistory = await PayHistory.find({status:"paid"},{_id:0,invoice:-1, created:-1, cost:-1, receiver:-1, payer:-1,realInvoice:-1 });
        return ResponseData.ok(res, "", { allVendors, allProducts,allPayHistory });
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
                    total: { $sum: "$cost" },
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
                    total: { $sum: "$cost" },
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
const getInvoiceList = async(req,res)=>
{
    try{
        const list = await PayHistory.find({receiver:(req.user._id)}).sort({created:"desc"});
        return ResponseData.ok(res, "", { list});
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Can not fetch", {});
    }
}
module.exports = {
    getSystemVendorDetails,
    getSentChartDetails,    
    getReceiveChartDetails,
    getInvoiceList,
}
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let PayHistorySchema = new Schema({
    warehouseId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref:'warehouses'
    },
    productIds:[{type:mongoose.Types.ObjectId}],
    products: [
        { 
            id:{type: mongoose.Types.ObjectId},
            cost:{type:Number},
            barcode:{type:String},
            productName:{type:String},
            mobile:{type:Number},            
        }
    ],
    totalCost: {
        type: Number,
        default: 0,
    },
    created: {
        type: Number,
        default: Date.now()
    },
    updated: {
        type: Number,
        default: Date.now()
    },
    status: {
        type: String,
        default: "unpaid"
    },
    receiver: {
        type: mongoose.Types.ObjectId,
        ref: "users",
    },
    payer: {
        type: mongoose.Types.ObjectId,
        ref: "users",
    },
    invoice: {
        type: String,
        default: ""
    },
    realInvoice: {
        type: String,
        default: ""
    },
    payMethods: {
        type: String,
        default: "manually",
    },
    // mobile:{
    //     type:Number,

    // }
});

// Export the model
module.exports = mongoose.model('PayHistory', PayHistorySchema);
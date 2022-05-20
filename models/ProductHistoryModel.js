const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ProductHistorySchema = new Schema({
    warehouseId:{
        type:mongoose.Types.ObjectId,
        ref:'warehouses',
    },
    productId:{
        type:mongoose.Types.ObjectId,
        ref:'products'
    },
    // barcode:{
    //     type:String,
    // },
    // mobile:{
    //     type:Number,
    // },
    timestamp:{
        type:Number,
        default:Date.now()
    },
    operation:{
        type:String,
        default:"", // position, pay, sms
    },
    result:{
        type:String,
        default:"", // success, failed
    },
    amount:{
        type:Number,
        
    },
    operator:{
        type:mongoose.Types.ObjectId,
        ref:'users'
    },
    barcode:{
        type:String,
    },
    mobile:{
        type:Number,

    },
    value:{
        type:String,
    },
});
// Export the model
module.exports = mongoose.model('ProductHistory', ProductHistorySchema);
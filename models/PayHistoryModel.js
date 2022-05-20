const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let PayHistorySchema = new Schema({
    vendorId:{
        type:String,
        required:true,
    },
    productId:{
        type:mongoose.Types.ObjectId
    },
    productName:{
        type:String,
        default:""
    },
    slotIndex:{
        type:Number,
        default:1,
    },
    cost:{
        type:Number,
        default:0,
    },
    created:{
        type:Number,
        default:Date.now()
    },
    updated:{
        type:Number,
        default:Date.now()
    },
    status:{
        type:String,
        default:"unpaid"
    },
    receiver:{
        type:mongoose.Types.ObjectId,
        ref:"users",
    },
    payer:{
        type:mongoose.Types.ObjectId,
        ref:"users",
    },
    invoice:{
        type:String,
        default:""
    },
    realInvoice:{
        type:String,
        default:""
    },
    taken:{
        type:Number,
        default:0,
    }
});

// Export the model
module.exports = mongoose.model('PayHistory', PayHistorySchema);
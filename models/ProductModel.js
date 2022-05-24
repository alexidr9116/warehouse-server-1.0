const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ProductSchema = new Schema({
    barcode:{
        type:String,
        required:true
    },
    title: {
        type: String,
        max: 100
    },
    priceY:{
        type:Number,
    },
    price: {
        type: Number,
        // required: true
    },
    mobile:{
        type:Number,
        // required:true,
    },
    
    weight:{
        type:Number,
        // required:true,
    },
    comment:{
        type:String,
    },
    size:{
        type:Number,
    },
    type:{
        type:String,
    },
    warehouseId:{
        type:mongoose.Types.ObjectId,
    },
    position:{
        type:String,
        default:"china",    // china, coming, ub, delivery, completed, 
    },
    payStatus:{
        type:String,
        default:"unpaid",
    },
    payMethods:{
        type:String,
        default:"manually",     // manually, qpay
    },

    chinaSms:{
        type:String,
        
    },
    ubSms:{
        type:String,
        
    },
    registeredAt:{
        type:Number,
        default:Date.now(),
    },
    
    leftAt:{
        type:Number,
    },
    arrivedUbAt:{
        type:Number,
    },
    arrivedUser:{
        type:Number,
    },
    deliveryCost:{
        type:Number,
        default:0,
    },
    deliveryType:{
        type:String,
        default:"",
    },
    totalCost:{
        type:Number,
    }
});

// Export the model
module.exports = mongoose.model('Product', ProductSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ReviewSchema = new Schema({
    warehouseId:{
        type:mongoose.Types.ObjectId,
        ref:'warehouses'
    },
    productId:{
        type:mongoose.Types.ObjectId,
        ref:'products'
    },
    
    writer:{
        type:mongoose.Types.ObjectId,
        ref:'users'
    },
    status:{
        type:String,
        default:'inactive',
    },
    comment:{
        type:String,
        default:""
    },
    recommendRate:{
        type:Number,
        default:0
    },
    timeRate:{
        type:Number,
        default:0,
    },
    brokenRate:{
        type:Number,
        default:0,
    },
    priceRate:{
        type:Number,
        default:0,
    },
    rate:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:Number,
        default:Date.now()
    }
});

// Export the model
module.exports = mongoose.model('Review', ReviewSchema);
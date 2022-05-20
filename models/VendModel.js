const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let VendSchema = new Schema({
    vendorId:{
        type:String,
        required:true,
    },
    slotCount:{
        type:Number,
        default:1,
    },
    title:{
        type:String,    
        default:""
    },
    description:{
        type:String,
        default:""
    },
    img: {
        type: String,
        default: 'uploads/images/mini-vendor.jpg'
    },
    deviceNumber:{
        type:Number,
        
    },
    type:{
        type:String,
        default:'ble',
        enum:['ble','4g','sms','wifi']
    },
    status:{
        type:String,
        default:"active"
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:"users",
    }
});

// Export the model
module.exports = mongoose.model('MiniVendor', VendSchema);
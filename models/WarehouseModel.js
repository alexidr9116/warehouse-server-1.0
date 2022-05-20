const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WarehouseSchema = new Schema({
    ub:{
        type:Object,
        default:{

            address:{
                type:String,
                
            },
            tel1:{
                type:Number,
            },
            tel2:{
                type:Number,
            },
            from:{
                type:Number,
            },
            to:{
                type:Number,
            }
        }
    }
    ,
    china:{
        type:Object,
        default:{

            address:{
                type:String,
                
            },
            tel1:{
                type:Number,
            },
            tel2:{
                type:Number,
            },
            from:{
                type:Number,
            },
            to:{
                type:Number,
            }
        }
    },

    name:{
        type:String,
    },
    openAlways:{
        type:Boolean,
        default:true
    },
    haveBusiness:{
        type:Boolean,
        default:true
    },
    price:{
        type:Number,
    },
    period:{
        type:Number,
    },
    img: {
        type: String,
        default: 'uploads/images/empty.jpg'
    },
    
    status:{
        type:String,
        default:"active"
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:"users",
    },
    description:{
        type:String,
        default:""
    }
});

// Export the model
module.exports = mongoose.model('Warehouse', WarehouseSchema);
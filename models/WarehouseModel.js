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
    payMethods:{
        type:String,
        default:"any",
    },
    
    price:{
        type:Number,    // Kg 
    },
    priceY:{
        type:Number,    // Yen
    },
    price1:{
        type:Number,    // M3
    },
    price1Y:{
        type:Number,    // China
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
    },
    deliveryCost1:{
        type:Number,
        default:10         // 10%
    },
    deliveryCost2:{
        type:Number,
        default:40000,         // box
    },
    deliveryCost3:{
        type:Number,
        default:0           // personal 
    },
    increaseRate:[0,10,1000,1000],
    increaseIndex:{type:Number, default:0}

});

// Export the model
module.exports = mongoose.model('Warehouse', WarehouseSchema);
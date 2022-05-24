const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationHistorySchema = new Schema({
    sender: {
        type: mongoose.Types.ObjectId,
        ref:'users',
    },
    receiver: {
        type: mongoose.Types.ObjectId,
        ref:'users',
    },
    content: {
        type: String,
        default: "",
    },
    addition:{
        type:String,
        default:""
    },
    productIds: [{ type: mongoose.Types.ObjectId }],
    products: [{
        id: { type: mongoose.Types.ObjectId },
        cost: { type: Number },
        barcode: { type: String },
        productName: { type: String },
        mobile: { type: Number },
    }],

    type: {
        type: String,
        default: "sms"           //  sms, payment, location
    },
    created: {
        type: Number,
        default: Date.now(),
    },
    read:{
        type:Boolean,
        default:false,
    }
});
// Export the model
module.exports = mongoose.model('Notification', NotificationHistorySchema);
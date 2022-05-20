const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
    mobile: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
    username: {
        type: String,
    },
    password: {
        type: String,
        default: "",
    },
    passwordLastChange: {
        type: Date,
        default: Date.now(),
    },
    pinCode: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: "active"
    },
    role: {
        type: String,
        default: 'user',
    },

    licenseKey: {
        type: String,
        default: ''
    },
    expired: {
        type: Date,
        default: new Date((Date.now() + 30 * 24 * 3600 * 1000))
    },
    created: {
        type: Number,
        default: Date.now()
    },
    avatar: {
        type: String,
        default: "uploads/images/avatar.jpg"
    },
    city: {
        type: String,
        default: ""
    },
    email:{
        type:String,
        default:"",
    },
    address: {
        type: String,
        default: "",
    },
    state: {
        type: String,
        default: "",

    },
    country: {
        type: Object,
        default: {
            code: { type: String, default: "" },
            value: { type: String, default: "" },
        }
    },
    firstName:{
        type:String,
        default:""
    },
    lastName:{
        type:String,
        default:""
    },
    payUsername:{
        type:String,
        default:""
    },
    payPassword:{
        type:String,
        default:""
    },
    invoiceAlias:{
        type:String,
        default:""
    },
    payPassphrase:{
        type:String,
        default:""
    }

});
class UserClass {
    static async isEmailExists(email) {
        var result = false;
        const data = await this.findOne({ email: email }).exec();
        if (data) result = true;
        return result;
    }
    static async isMobileExists(mobile) {
        var result = false;
        const data = await this.findOne({ mobile: mobile }).exec();
        if (data) result = true;
        return result;
    }

    static async findByMobile(mobile) {
        var result = null;
        const data = await this.findOne({ mobile: mobile }).exec();
        if (data) result = data;
        return result;
    }
    static async updatePassword(mobile, password) {
        return new Promise(async (resolve, reject) => {
            var isExists = await this.isMobileExists(mobile);
            if (isExists) {
                this.findOneAndUpdate(
                    { mobile },
                    { $set: { password: password, passwordLastChange: Date.now() } },
                    { new: true, useFindAndModify: true },
                    (err, doc) => {
                        if (err) {
                            console.log("Something wrong when calling updatePassword!");
                            resolve("Something wrong when calling updatePassword!");
                        }
                        resolve("true");
                    }
                );
            } else {
                resolve("User email not found.");
            }
        });
    }
    static async updateOTP(mobile, otp) {
        return new Promise(async (resolve, reject) => {
            var isExists = await this.isMobileExists(mobile);
            if (isExists) {
                this.findOneAndUpdate(
                    { mobile: mobile },
                    { $set: { otp: otp } },
                    { new: true, useFindAndModify: true },
                    (err, doc) => {
                        if (err) {
                            console.log("Something wrong when calling updateOTP!");
                            resolve("Something wrong when calling updateOTP!");
                        }
                        resolve("true");
                    }
                );
            } else {
                resolve("User mobile not found.");
            }
        });
    }

}
UserSchema.loadClass(UserClass);
const Users = mongoose.model("User", UserSchema);
module.exports = Users;

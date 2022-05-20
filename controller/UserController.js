const { validationResult } = require("express-validator");
const User = require("../models/UserModel");
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require("fs");
const ResponseData = require("../utils/ResponseData");
const { ResponseUserModel, checkPassword, encryptPassword } = require("./AuthController");
const { encryptWithAES } = require("../utils/AESTextEnDecrypt");
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;

const account = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty()) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    else {
        return ResponseData.ok(res, "", { user: ResponseUserModel(req.user) });
    }

}
const changePassword = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        let user = await User.findById(req.user._id);
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (user.password && user.password != "") {
            if (await checkPassword(oldPassword, user.password) && newPassword == confirmPassword) {
                user.password = await encryptPassword(newPassword);
                await user.save();
                ResponseData.ok(res, "Password changed");
            }
            else {
                ResponseData.error(res, "Password incorrect");
            }
        }
        else {
            if (req.newPassword == req.confirmPassword) {
                user.password = await encryptPassword(newPassword);
                await user.save();
                ResponseData.ok(res, "Password has set");
            }
            else {
                ResponseData.error(res, "Password Not Matched");
            }
        }

    }
    catch (err) {
        console.log(err);
        ResponseData.error(res, "Server Error", err);
    }
}
const setBillingInfo = async(req,res)=>{
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    try {
        const user = await User.findById(req.user._id);
        if(user.mobile != ADMIN_PHONE_NUMBER)
            user.role = "admin";
        else
            user.role = "super-admin";
        user.invoiceAlias = req.body.invoiceAlias;
        user.payUsername = req.body.payUsername;
        user.payPassword =  encryptWithAES(req.body.payPassword, req.body.payPassphrase);
        user.payPassphrase = req.body.payPassphrase;
        await user.save();
        return ResponseData.ok(res,"Saved successful",{});
    }
    catch(err){
        return ResponseData.ok(res,"Can not save user billing data",{err});
    }
}
const setProfile = async (req, res) => {
    if (req.file) {
        var result = validationResult(req);
        if (!result.isEmpty()) {
            fs.unlink(path.resolve(req.file.path), (err) => { });
            return ResponseData.error(res, result.array()[0].msg);
        }

    }
    try {
        let user = await User.findById(req.user._id);
        if (req.file)
            user.avatar = req.file.path;

        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.email = req.body.email;
        user.address = req.body.address;
        await user.save();
        ResponseData.ok(res, "Profile was changed", ResponseUserModel(user));
    } catch (error) {
        console.log(error);
        ResponseData.error(res, "Not saved", error);
    }

}
const adminList = async(req,res)=>{
    const users = await User.find({role:/admin/}).sort({ mobile: -1 });
    return ResponseData.ok(res, "", { users });
}
const userList = async (req, res) => {
    var result = validationResult(req);
    if (!result.isEmpty()) {

        return ResponseData.error(res, result.array()[0].msg);
    }
    const users = await User.find({}).sort({ mobile: -1 });

    return ResponseData.ok(res, "", { users });
}
const changeActive = async (req, res) => {
    try {
        const user = await User.findById(ObjectId(req.body.id));
        user.status = (user.status === "active" ? "inactive" : "active");
        await user.save();
        return ResponseData.ok(res, "Changed Successful", { user });
    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "Can not changed", {});
    }
}
const remove = async (req, res) => {
    try {
        console.log(req.params);
        const result = await User.findByIdAndRemove(ObjectId(req.params.id));
        return ResponseData.ok(res, `Removed user from the system`, {});
    }
    catch (err) {
        console.log(err)
        return ResponseData.error(res, "Can not changed", {});
    }
}
module.exports = {
    account,
    setProfile,
    changePassword,
    userList,
    changeActive,
    remove,
    setBillingInfo,
    adminList,
}
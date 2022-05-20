const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const bcrypt = require('bcryptjs');
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;
const otpGenerator = require('otp-generator');
// Load input validation
const ResponseData = require("../utils/ResponseData");
const { sendOtp } = require("../utils/Channel");

// Load User model
const User = require("../models/UserModel");
const { validationResult } = require("express-validator");
const { decryptWithAES } = require("../utils/AESTextEnDecrypt");


const otps = [];
const encryptPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        bcrypt.hash(password, 10, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
};
const checkPassword = (password, hashPassword) => {
    return new Promise(async (resolve, reject) => {
        bcrypt.compare(
            password.toString(),
            hashPassword.toString(),
            (err, data) => {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
};

const jwtsign = (payload) => {
    // Sign token
    return jwt.sign(
        payload,
        keys.secretOrKey, {
        expiresIn: 31556926 // 1 year in seconds
    }
    );
}

const ResponseUserModel = (user) => {
    let status = user.status;
    if (user.phoneNumber != ADMIN_PHONE_NUMBER) {

        if (user.expired) {
            const offset = new Date(user.expired).getTime() - Date.now();
            if (offset < 0) {
                status = "expired";
            }
            if (user.licenseKey == undefined || user.licenseKey == "") {
                status = "trial";
            }
        } else {
            status = "trial"
        }
    }

    return {
        mobile: user.mobile,
        avatar: user.avatar,
        pinCode: user.pinCode,
        status: status,
        username: user.username,
        role: user.role,
        expired: user.expired,
        licenseKey: user.licenseKey,
        firstName:user.firstName,
        lastName:user.lastName,
        address:user.address,
        email:user.email,
        invoiceAlias:user.invoiceAlias,
        payUsername:user.payUsername,
        payPassword:(user.payPassword && user.payPassword!=""? decryptWithAES(user.payPassword,user.payPassphrase):"") ,
        payPassphrase:user.payPassphrase,
        fullName:`${user.firstName} ${user.lastName}`,
        _id:user._id,
    }
}

const login = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }

    try {
        const mobile = req.body.mobile;
        const exist = await User.isMobileExists(mobile);
        if (!exist) {
            otps[mobile] = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
            // opt send
            const result = await sendOtp(mobile, otps[mobile]);
            console.log(otps[mobile]);
            if (result != null)
                return ResponseData.ok(res, "Sent OTP, please verify",{step:'otp'});
            else {
                return ResponseData.ok(res, "Didn't send OTP, please check your mobile number again",{step:'login'});
            }
        }
        else {
            const user = await User.findOne({mobile});
            const isPassword = (user.password && user.password != "");
            if (isPassword) {
                return ResponseData.ok(res, "Check Password", { passwordVerify: isPassword,step:'password' });

            }
            else {
                User.findOne({ mobile }).then(async (user) => {
                    try {
                        const payload = {
                            id: user._id,
                            mobile: user.mobile,
                        };
            
                        const token = jwtsign(payload);
                        return ResponseData.ok(res,"Empty Password, verified successful",{token,user:ResponseUserModel(user),step:'navigate'}); 
                    } catch (e) {
                        console.log(e); // caught
                    }
                })
               
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}

const verifyPassword = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const password = req.body.password;
    const mobile = req.body.mobile;
    User.findOne({ mobile }).then(async (user) => {
        try {
            if (!await checkPassword(password, user.password)) {
                return ResponseData.error(res,"Wrong password, check again",{success:false});
            }
            const payload = {
                id: user._id,
                mobile: user.mobile,
            };
            const token = jwtsign(payload);
            const status = user.status;
            
            return ResponseData.ok(res,"Password verified successful",{token,user:ResponseUserModel(user)}); 
        } catch (e) {
            console.log(e); // caught
        }
    })
}

const verifyOtp = async (req, res) => {

    const validResult = validationResult(req);
    if (!validResult.isEmpty) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    const { mobile, otp } = req.body; 
    try {
        if (otps[mobile] && `${otps[mobile]}` == otp) {
            return ResponseData.ok(res,"OTP verified success, please set your password",{success:true});
        } else {
          
            return ResponseData.ok(res,`${otp} is wrong`,{success:false});
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res,`${err}`); 
    }
}

const register = async (req, res) => {
    const validResult = validationResult(req);
    if (!validResult.isEmpty) {
        return ResponseData.error(res, validResult.array()[0].msg);
    }
    try {
        const { mobile, password } = req.body;
        if (await User.isMobileExists(mobile)) {
            ResponseData.error(res,`${mobile} - phone number is already exist`);
        }
        const newUser = new User({
            mobile,
            password: (password? encryptPassword(password) :""),
            role: (ADMIN_PHONE_NUMBER == mobile ? "admin" : "user"),
        });
        await newUser.save();
        const payload = { id: newUser._id, mobile: newUser.mobile };
        const token = jwtsign(payload);
        return ResponseData.ok(res, "Registered successful", { token, success: true, user: ResponseUserModel(newUser) });

    }
    catch (err) {
        console.log(err);
        return ResponseData.error(res, "", err);
    }


}
module.exports = {
    login,
    verifyOtp,
    verifyPassword,
    register,
    ResponseUserModel,
    checkPassword,
    encryptPassword,
    
}
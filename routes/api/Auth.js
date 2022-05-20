const express = require("express");
const router = express.Router();
const AuthController = require('../../controller/AuthController');
const UserController = require('../../controller/UserController');
const validator = require("../../validation");
const auth = require("../../middleware/auth");
const { imageUpload } = require("../../utils/FileUploader");
const jwtsign = (payload) => {
    // Sign token
    return jwt.sign(
        payload,
        keys.secretOrKey, {
        expiresIn: 31556926 // 1 year in seconds
    }
    );
}

router.post(
    '/login',
    validator.reqStringValidator('mobile', 6),
    AuthController.login
)
router.post(
    '/register',
    validator.mobileValidator,
    validator.mobileUserValidator,
    validator.reqStringValidator("password", 8),
    AuthController.register,
)
router.post(
    '/verify-otp',
    validator.reqStringValidator('otp', 6),
    AuthController.verifyOtp
)
router.post(
    '/verify-password',
    validator.mobileValidator,
    validator.reqStringValidator("password", 8),
    AuthController.verifyPassword
)
router.get(
    "/my-account",
    auth,
    UserController.account
)
router.post(
    "/set-profile-with-image",
    auth,
    [
        imageUpload.single("avatar"),
        validator.reqStringValidator('firstName'),
        validator.reqStringValidator('lastName'),
        validator.reqStringValidator('address'),
    ],
    UserController.setProfile
)
router.post(
    "/set-profile-without-image",
    auth,
    [
        validator.reqStringValidator('firstName'),
        validator.reqStringValidator('lastName'),
        validator.reqStringValidator('address'),
    ],
    UserController.setProfile
)
router.post("/change-password",
    auth,
    validator.reqStringValidator('newPassword'),
    validator.reqStringValidator('confirmPassword'),
    UserController.changePassword
)
router.post("/set-billing",
    auth,
    validator.reqStringValidator('payUsername'),
    validator.reqStringValidator('payPassword'),
    validator.reqStringValidator('payPassphrase'),
    validator.reqStringValidator('invoiceAlias'),
    UserController.setBillingInfo
)
module.exports = router;
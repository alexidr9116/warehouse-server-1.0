const CryptoJS = require('crypto-js');
const encryptWithAES = (text,passphrase)=>{
    return CryptoJS.AES.encrypt(text,passphrase).toString();
}
const decryptWithAES = (cipherText,passphrase)=>{
    const bytes = CryptoJS.AES.decrypt(cipherText,passphrase);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}
module.exports = {
    encryptWithAES,
    decryptWithAES,
}
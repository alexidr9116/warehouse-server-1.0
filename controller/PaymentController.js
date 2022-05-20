const axios = require('axios');
const FormData = require('form-data');
const QPAY_API_URL = process.env.QPAY_API_URL; 
const ResponseData = require("../utils/ResponseData");
const PayHistory = require('../models/PayHistoryModel');
const Product = require('../models/ProductModel');
const VendModel = require('../models/VendModel');
const PayHistoryModel = require('../models/PayHistoryModel');
const Users = require('../models/UserModel');
const { decryptWithAES } = require('../utils/AESTextEnDecrypt');

const QPay = () => {
    const _getEbarimt = async(token, payment_id) => {

        const formData = new FormData();
        formData.append("payment_id", payment_id);
        formData.append("ebarimt_receiver_type", "CITIZEN");
        const response = await axios.post(`${QPAY_API_URL}ebarimt/create`,
            formData, {
                headers: {
                    ...formData.getHeaders(),
                    "Content-Length": formData.getLengthSync(),
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': '"multipart/form-data"'
                }
            });
        try {
            return { status: 200, data: response.data }
        } catch (err) {
            console.log(err);
            return { status: 500 }
        }
    }
    const _paymentCheck = async(token, invoice_id) => {
        try {

            const checkParam = {
                "object_type": "INVOICE",
                "object_id": invoice_id,
                "offset": {
                    "page_number": 1,
                    "page_limit": 100
                }
            }
            const response = await axios.post(`${QPAY_API_URL}payment/check`,
                checkParam, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            if (response.status === 200) {
                return { result: response.data, status: 200 };
            } else {
                return { result: response.data, status: 201 };
            }
        } catch (err) {
            console.log(err)
            return { status: 500, result: err };
        }
    }
    const _payWithToken = async(invoice, token) => {
        const response = await axios.post(`${QPAY_API_URL}invoice`,
            invoice, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        if (response.status === 200) {
            //  console.log(response.data)
            return response.data;
        } else {
            return null;
        }

    }
    const _getAuthToken = async(username, password) => {
        const config = {
            auth: {
                username: username || process.env.QPAY_AUTH_TOKEN_USERNAME,
                password: password || process.env.QPAY_AUTH_TOKEN_PASSWORD
            }
        };

        const response = await axios.post(
            `${QPAY_API_URL}auth/token`, {}, config
        );

        if (response.status == 200 && response.data.access_token) {

            return response.data.access_token;
        }
        return null;
    }
    return {
        getAuthToken: _getAuthToken,
        payWithToken: _payWithToken,
        paymentCheck: _paymentCheck,
        getEbarimt: _getEbarimt,
    }
}

const getEbarimt = async(req, res) => {
    try {

        const PayHistory = await PayHistoryModel.findOne({realInvoice: req.body.invoice_id});
        if(PayHistory!=null){
            const vendor = await VendModel.findOne({vendorId:PayHistory.vendorId});
            const receiver = await Users.findOne({_id:vendor.owner});
            const { payUsername, payPassword,  payPassphrase, } = receiver;
            const token = await QPay().getAuthToken(payUsername,decryptWithAES(payPassword,payPassphrase));
            const paymentCheck = await QPay().paymentCheck(token, req.body.invoice_id);
            // const ebarimt = await QPay().getEbarimt(token, req.body.invoice_id);
            if (paymentCheck.status === 200) {
    
                const payment_id = paymentCheck.result.rows[0].payment_id;
                const ebarimt = await QPay().getEbarimt(token, payment_id);
                if (ebarimt.status === 200) {
                    return ResponseData.ok(res, "", { ebarimt });
                } else {
                    return ResponseData.error(res, "Can not get Ebarimt data", { ebarimt });
                }
            } else {
                return ResponseData.error(res, "Can not check payment API", { paymentCheck });
            }

        }
        else{
            return ResponseData.error(res, "Can not find pay history",);
        }
    } catch (err) {
        console.log(err)
        return ResponseData.error(res, "Unknown error", { err });
    }


}

const getHistoryByInvoice = async(req,res)=>{
    const {invoice} = req.params;
    const historyArr = await PayHistory.aggregate([
        {
            $match:{realInvoice:invoice}
        },
        {
            $lookup:{
                from:'products',
                localField:'productId',
                foreignField:'_id',
                as:'product'
            }
        },
        {
            $unwind:'$product'
        }
    ]) 
    const history = historyArr[0];
    if(history!=null){
        const vendor = await VendModel.findOne({vendorId:history.vendorId});
        return ResponseData.ok(res, "", { history,vendor });
    }
    else{
        return ResponseData.error(res, `Can not find payment history with invoice "${invoice}"` );
    }
}
module.exports = { QPay, getEbarimt,getHistoryByInvoice }
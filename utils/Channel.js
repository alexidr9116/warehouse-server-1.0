const axios = require('axios');

const sendSms = async(data, options, res) => {
    try {
        // const url = `${process.env.SMS_SERVICE_URL}?uname=${process.env.SMS_USER_NAME}&upass=${process.env.SMS_USER_PWD}&from=${data.from}&mobile=${data.mobile}&sms=sendsms`;
        const SMS_ADMIN_PHONE_NUMBER = 132933;
        const mobile = data.mobile;
        let url = `${process.env.SMS_SERVICE_URL }?uname=${process.env.SMS_USER_NAME}&upass=${process.env.SMS_USER_PWD}&from=${SMS_ADMIN_PHONE_NUMBER}&mobile=${mobile}&sms=${data.sms}`;
        if (`${mobile}`.startsWith("9")) {
            url = `${process.env.SMS_SERVICE_URL_N9}/mt?servicename=elec&username=service&from=${SMS_ADMIN_PHONE_NUMBER}&to=${mobile}&msg=${data.sms}`;
        }

        // const url = "http://sms.unitel.mn/sendSMS.php?uname=elec&upass=Unitel88&sms=as&from=132933&mobile=89932933";
        // send command to iot device
        const response = await axios.get(url, {});
        // console.log(data, "is send to sms");

        return response?.data;
    } catch (err) {
        // console.log(err, "is error");
        return null;
    }

}
const sendPassword = async(phoneNumber, password, sender, invoice) => {
    try {
        const SMS = `acha awah code ${ password } \n Ilgeegch:${sender} \n hundetgesen http://ezo.mn/`;
        const SMS_ADMIN_PHONE_NUMBER = 132933;

        let url = `
                ${process.env.SMS_SERVICE_URL}?uname=${process.env.SMS_USER_NAME}&upass=${process.env.SMS_USER_PWD}&from=${SMS_ADMIN_PHONE_NUMBER}&mobile=${phoneNumber}&sms=${SMS}
                `;
        if (`${phoneNumber}`.startsWith("9")) {
            url = `${process.env.SMS_SERVICE_URL_N9}/mt?servicename=elec&username=service&from=${SMS_ADMIN_PHONE_NUMBER}&to=${phoneNumber}&msg=${SMS}`;
        }
        const response = await axios.get(url, {});

        return response;
    } catch (err) {
        return null;
    }

}
const sendOtp = async(phoneNumber, otp) => {
    try {
        const SMS = `sn bn u, code ${ otp } \n http://ezo.mn/`;
        const SMS_ADMIN_PHONE_NUMBER = 132933;

        let url = `
                ${process.env.SMS_SERVICE_URL}?uname=${process.env.SMS_USER_NAME}&upass=${process.env.SMS_USER_PWD}&from=${SMS_ADMIN_PHONE_NUMBER}&mobile=${phoneNumber}&sms=${SMS}
                `;
        if (`${phoneNumber}`.startsWith("9")) {
            url = `${process.env.SMS_SERVICE_URL_N9}/mt?servicename=elec&username=service&from=${SMS_ADMIN_PHONE_NUMBER}&to=${phoneNumber}&msg=${SMS}`;
            console.log("sent", url);
        }
        const response = await axios.get(url, {});
        console.log(response);
        return response;
    } catch (err) {
        return null;
    }

}
const sendMqtt = async(data, options, res) => {
    try {
        const response = await axios.post(process.env.MQTT_SERVICE_URL, data, options);

        return response;
    } catch (err) {
        return null;
    }


}
module.exports = { sendSms, sendMqtt, sendOtp, sendPassword }
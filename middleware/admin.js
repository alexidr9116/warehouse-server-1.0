const ResponseData = require('../utils/ResponseData')
module.exports = async(req,res,next) =>{
    if(req.user && req.user._id && req.user.role.includes("admin")){
        next();
    }
    else{
        ResponseData.error(res,"Login with Administrator",{});
    }
     
}
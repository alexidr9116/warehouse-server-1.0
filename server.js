const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

const path = require("path");
require("dotenv").config();
// api routers
const adminRoute = require('./routes/api/Admin');
const authRoute = require("./routes/api/Auth"); 
const reviewRoute = require("./routes/api/Review"); 
const warehouseRoute = require("./routes/api/Warehouse"); 
const productRoute = require("./routes/api/Products"); 
const paymentRoute = require('./routes/api/Payment');
const paymentHookRoute = require('./routes/api/PaymentHookRoute');
const app = express();
// Bodyparser middleware
app.use(cors())
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(bodyParser.json());
app.use(bodyParser.raw());
// DB Config
const DATABASE_CONNECTION = process.env.DATABASE_ATLAS_URL;
// Connect to MongoDB
const option = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
    //ssl:true,
}
mongoose
    .connect(
        DATABASE_CONNECTION,
        option
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));

const assetFolder = path.resolve(__dirname, './build/');
const uploadsFolder = path.resolve(__dirname, './uploads/');
// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);
// Routes
app.use("/api/warehouse/auth/", authRoute);
app.use("/api/warehouse/admin/", adminRoute); 
app.use("/api/warehouse/warehouse/", warehouseRoute); 
app.use("/api/warehouse/review/", reviewRoute); 
app.use("/api/warehouse/product/", productRoute); 
app.use("/api/warehouse/payment/", paymentRoute); 
app.use("/api/warehouse/hook/payment/", paymentHookRoute); 
app.use("/uploads", express.static('uploads'));

app.use(express.static(assetFolder));
app.use("*", express.static(assetFolder))
const port = process.env.PORT || 5500; // process.env.port is Heroku's port if you choose to deploy the app there
const server = app.listen(port, () => {
    console.log(`Server up and running on port ${port} !`)

});

// const https = require('https');
// const fs = require('fs');
// https.createServer({
//     key:fs.readFileSync('./certs/key.pem'),
//     cert:fs.readFileSync('./certs/cert.pem')
// }, app).listen(port, () => {
//         console.log(`Server up and running on port ${port} !`)
    
//     });
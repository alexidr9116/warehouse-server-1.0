const multer = require("multer");
const otp = require('otp-generator');
const path = require("path");

const imageStorage = multer.diskStorage({
  // Destination to store image
  destination: "./uploads/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname +
        "-x" +
        otp.generate(6,{digits:true,specialChars:false}) +
        "-c" +
        Date.now() +
        path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});

const videoStorage = multer.diskStorage({
  // Destination to store image
  destination: "./uploads/videos",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname +
        "x" +
        Global.randomNumber(6) +
        "c" +
        Date.now() +
        path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});

const pdfStorage = multer.diskStorage({
  // Destination to store image
  destination: "./uploads/files",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname +
        "x" +
        Global.randomNumber(6) +
        "c" +
        Date.now() +
        path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});

var imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 1000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg|bmp)$/)) {
      // upload only png and jpg format
      
      return cb(new Error("Please upload a Image"));
    }
    cb(null, true);
  },
  
});
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    // upload only mp4 and mkv format
    if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) {
      return cb(new Error("Please upload a video"));
    }
    cb(null, true);
  },
});
 
const pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    // upload only mp4 and mkv format
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error("Please upload a pdf file."));
    }
    cb(null, true);
  },
});
// --------------------------------------
 
// --------------------------------------

module.exports = {
  imageUpload,
  videoUpload,
  pdfUpload,
  
};

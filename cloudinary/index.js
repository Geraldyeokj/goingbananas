const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

/*
const storageCloud = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "GoingBananasV2",
        allowedFormats: ["jpeg", "jpg"],
        public_id: (req.user.username || "checkme")
    }
});
*/

module.exports = {
    cloudinary//,
    //storageCloud
}
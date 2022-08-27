const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

// ImageSchema.virtual('thumbnail').get(function () {
//     return this.url.replace('/upload', '/upload/w_200');
// });

const BananadataSchema = new Schema({
    ripeness: String,
    user: String,
    date: Number,
    image: [ImageSchema]
});

module.exports = mongoose.model('Banana', BananadataSchema);
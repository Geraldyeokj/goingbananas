const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

const locationData = new Schema({
    present: Boolean,
    longitude: String, 
    latitude: String
});

// ImageSchema.virtual('thumbnail').get(function () {
//     return this.url.replace('/upload', '/upload/w_200');
// });

const BananadataSchema = new Schema({
    ripeness: String,
    user: String,
    date: Number,
    location: locationData,
    locationGuess: String,
    image: [ImageSchema],
    sim: Boolean,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

const Banana = mongoose.model('Banana', BananadataSchema);
const Location = mongoose.model('Location', locationData);
const Image = mongoose.model('Image', ImageSchema);

module.exports = {
    Banana: Banana,
    Location: Location,
    Image: Image
}
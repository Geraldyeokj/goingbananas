const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const tfnode = require('@tensorflow/tfjs-node');
const fs = require('fs');

//const path = "uploads/checkme.jpg"

const readImage = path => {
    const imageBuffer = fs.readFileSync(path);
    const tfimage = tfnode.node.decodeImage(imageBuffer);
    return tfimage;
};

//DO NOT MAKE AYNC FUNCTION IF WANT SYNCHRONUS
async function imageClassification(path) {
    const image = readImage(path);
    const mobilenetModel = await mobilenet.load();
    const predictions =  await mobilenetModel.classify(image);
    return predictions;
}

module.exports = imageClassification;
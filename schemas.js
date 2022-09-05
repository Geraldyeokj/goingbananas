const Joi = require("joi");

module.exports.bananatestSchema = Joi.object({
    //image: File,
    longitude: Joi.string().required(),
    latitude: Joi.string().required(),
    locationSent: Joi.string().required()
});
//const {bananaspotSchema, reviewSchema} = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");
const Banana = require("./models/bananadata");
//const Review = require("./models/review");

module.exports.isLoggedIn = (req, res, next) => {
    //console.log("REQ.USER...", req.user);
    if (!req.isAuthenticated()) {
        console.log("isLoggedIn: not logged in");
        //console.log(req.body);
        //console.log("originalURL:" + req.originalUrl);
        console.log("isLoggedIn: returnTo saving");
        req.session.returnTo =  req.originalUrl;
        console.log("isLoggedIn: redirection");
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    console.log("isLoggedIn: is logged in");
    next();
}
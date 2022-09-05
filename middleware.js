const {bananatestSchema} = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");
const {Banana} = require("./models/bananadata");
//if there are multiple exports need to use {Banana, ... ,...}
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

module.exports.validateBananatest = (req, res, next) => {
    const {error} = bananatestSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        if (req.file == null){
            req.flash("error", "You must include an image!");
            return res.redirect("/bananatest");
        }
        next();
    }
}

module.exports.isAuthor = async(req, res, next) => {
    console.log(req.body.id);
    const bananadatum = await Banana.findById(req.body.id);
    console.log("bananadatum.user: " + bananadatum.user);
    console.log(req.user);
    if(!(bananadatum.user == (req.user.username))){
        req.flash("error", "You do not have permission to do that!");
        return res.redirect(`/bananaspots/${id}`)
    }
    next();
}
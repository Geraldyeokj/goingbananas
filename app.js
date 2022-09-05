if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const passport = require("passport");
const LocalStrategy  = require("passport-local");
const {Banana, Location} = require('./models/bananadata');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
//const imageClassification = require('./utils/MachineMagic');
const fsExtra = require('fs-extra')
const User = require("./models/user");
const {isLoggedIn, isAuthor, validateBananatest} = require("./middleware");
const catchAsync = require("./utils/catchAsync");
const uuid = require('uuid');
const geoip = require('geoip-lite');

const MachineMagic = require("./machineMagic/pyintegrationv31");

const multer = require('multer');

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

//add + Date.now() in between checkme and ext.name to make it unique
function uuidInSession(req, res, next) {
    console.log(req.session);
    console.log("Creating New UUID");
    const newUuid = uuid.v4()
    req.session.uuid = newUuid;
    console.log(req.session.uuid);
    next();
}

/*
async function imageDoubleUpload(req, res, next) {
    console.log("uploadLocal in progress");
    const storageLocal = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/')
        },
        filename: function (req, file, cb) {
          console.log("image upload in progress");
          console.log(req.session.uuid);
          console.log((req.user.username || "checkme") + req.session.uuid);
          req.session.imageName = (req.user.username || "checkme") + req.session.uuid + path.extname(file.originalname);
          console.log("storageLocal imageName:" + req.session.imageName);
          req.session.imageType = path.extname(file.originalname);
          cb(null, (req.session.imageName || "checkme")); //Appending extension
        }
    });
    const uploadLocal = multer({ storage: storageLocal });
    uploadLocal.single('image')(req, res, next);
    console.log("uploadCloud staging");
    const storageCloud = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "GoingBananasV2",
            allowedFormats: ["jpeg", "jpg"],
            public_id: () => {req.session.imageName}
        } 
    });
    const uploadCloud = multer({ storage: storageCloud });
    console.log("uploadCloud in progress");
    uploadCloud.single('image')(req, res, next);
    console.log(req.session);
    next();
}
*/


const MongoStore = require("connect-mongo");
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/banana-spot"
//mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority


mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const secret = process.env.SECRET

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret
    }
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e);
})



const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    store,
    name: 'session',
    secret: "notverysecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//WHY RAN SO MANY TIMES? ONLY RUN ONCE PER REQUEST NO?
app.use((req, res, next) => {
    //console.log(req.session);
    //console.log(req.user);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// function uploadFile(req, res, next) {
//     const upload = multer().single('image');

//     upload(req, res, function (err) {
//         if (err instanceof multer.MulterError) {
//             console.log("A Multer error occurred when uploading.");
//         } else if (err) {
//             console.log("An unknown error occurred when uploading.");
//         }
//         // Everything went fine. 
//         next()
//     })
// }

//NOTE: problem with solution is that may not be possible to process pictures smultaneously

// function clearUploads(req, res, next) {
//     fsExtra.emptyDirSync("uploads/");
//     next();
// } 

console.log("uploadLocal in progress");
const storageLocal = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log("image upload in progress");
        console.log(req.session.uuid);
        console.log((req.user.username || "checkme") + req.session.uuid);
        req.session.imageName = (req.user.username || "checkme") + req.session.uuid + path.extname(file.originalname);
        console.log("storageLocal imageName:" + req.session.imageName);
        req.session.imageType = path.extname(file.originalname);
        cb(null, (req.session.imageName || "checkme")); //Appending extension
    }
});
const uploadLocal = multer({ storage: storageLocal });

app.get('/', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip == "::1") {
        ip = "128.135.164.0";
    };
    const geo = geoip.lookup(ip);
    const latlong = ((geo.ll == null) ? [41.789722, 41.789722] : geo.ll);

    const bananadataset = await Banana.find({$or:[{ripeness: "freshunripe"}, {ripeness:"ripe"}]});
    //console.log(bananadataset);
    res.render("home", {latlong, bananadataset});
});

app.get('/bananatest', isLoggedIn, (req, res) => {
    res.render("bananas/bananatest");
});

function cloudUpload(req, res, next) {
    console.log("uploads/" + req.session.imageName);
    const publicID = req.session.imageName;
    cloudinary.uploader.upload("uploads/" + req.session.imageName, {
        folder: "GoingBananasV2",
        allowedFormats: ["jpeg", "jpg", "JPG", "JPEG"],
        public_id: publicID,
    }, function(error, result) {
        console.log(result, error); 
        req.session.imageUrl = result.url;
        next();
    });
};

app.post('/bananatest', uuidInSession, isLoggedIn, uploadLocal.single('image'), validateBananatest, cloudUpload, async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    if (ip == "::1") {
        ip = "128.135.164.0";
    }
    const geo = geoip.lookup(ip);
    const latlong = geo.ll;
    const bananadataset = await Banana.find({$or:[{ripeness: "freshunripe"}, {ripeness:"ripe"}]});
    
    console.log(res.headersSent);
    try {
        console.log("header check 1:");
        console.log(res.headersSent);
        if (req.session.imageType === ".jpg" || req.session.imageType === ".jpeg") { //|| req.session.imageType === ".png"
            console.log("header check 2:");
            console.log(res.headersSent);
            
            console.log("image classification in process");
            console.log(req.session);
            
            console.log("header check 2.1:");
            console.log(res.headersSent);

            const imageName = req.session.imageName;

            console.log("header check 2.1.1:");
            console.log(res.headersSent);

            // AWAIT MAKES THIS A HEADER SEND?????
            console.log("imageclassification imageName:" + imageName);
            
            console.log("header check 2.2:");
            console.log(res.headersSent);
            
            const ripeness = await MachineMagic.imageClassification(`../uploads/${imageName}`);
            /*
            const ripeness = [
                { className: 'banana', probability: 0.99310702085495 },
                { className: 'orange', probability: 0.002831569407135248 },
                { className: 'lemon', probability: 0.0023115556687116623 }
              ];
              */

            console.log("ripeness val aft return: " + ripeness); 

            //deletes image after checking is complete
            console.log("header check 3:");
            console.log(res.headersSent);
            console.log("image removal in process");
            fsExtra.remove(`uploads/${imageName}`);

            console.log("header check 4:");
            console.log(res.headersSent);

            console.log(req.body);

            locationData = new Location({
                present: req.body.locationSent,
                longitude: req.body.longitude, 
                latitude: req.body.latitude    
            });

            if (req.body.locationSent === "true") {
                console.log("location services allowed, using GPS to determine location");
            } else {
                console.log("location services not allowed, using IP to determine location");
                let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
                if (ip == "::1") {
                    ip = "128.135.164.0";
                }
                const geo = geoip.lookup(ip);
                const latlong = geo.ll;
                locationData.present === "false";
                locationData.longitude = latlong[1];
                locationData.latitude = latlong[0];
            }

            await geocoder.reverseGeocode({
                query: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)]
              })
                .send()
                .then(response => {
                  // GeoJSON document with geocoding matches
                  console.log(response);
                  console.log(response.body);
                  const locationGuess = response.body.features[0].place_name;
                  req.session.locationGuess = locationGuess;
                })
                .catch((error) => {
                    console.error(error);
                    Error
                  });

            

            console.log("prediction assignment in process");
            
            const prediction = ripeness || "prediction error";
            console.log("prediction" + prediction);

            console.log("bananadatapoint generation");
            const bananaDataPoint = new Banana({
                ripeness: prediction,
                user: req.user.username,
                location: locationData,
                locationGuess: req.session.locationGuess,
                date: Date.now(),
                image: {
                    url: req.session.imageUrl, 
                    filename: req.session.imageName
                },
                sim: false,
                geometry: {
                    type: "Point",
                    coordinates: [
                        locationData.longitude, 
                        locationData.latitude 
                    ]
                }
            });
            console.log(req.user);
            console.log(req.session.passport.user);
            console.log(bananaDataPoint);
            console.log("bananadatapoint saving...");
            await bananaDataPoint.save();

            console.log("result rendering in process");
            console.log(res.headersSent);
            return res.render("bananas/results", {prediction, latlong, bananadataset});
        } else {
            console.log("image removal in process");
            fsExtra.remove(`uploads/${req.session.imageName}`);
            req.flash("error", "filetype not .jpg");
            return res.redirect("/bananatest");
        }  
        //res.send("we are checking");
    } catch (error) {
        console.error(error);
        next();
    }
});

app.post("/delete", isLoggedIn, isAuthor, async (req, res) => {
    const bananadatum = await Banana.findByIdAndDelete(req.body.id);
    req.flash("success", "Successfully deleted bananadatum");
    res.redirect("/posts");
})

app.get("/posts", isLoggedIn, async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    if (ip == "::1") {
        ip = "128.135.164.0";
    }
    const geo = geoip.lookup(ip);
    const latlong = geo.ll;

    const bananaDataPoints = await Banana.find({user: req.user.username});
    console.log(bananaDataPoints);
    res.render("bananas/posts", {latlong, bananaDataPoints});
})


app.get("/register", (req, res) => {
    res.render("users/register");
});

//client side validation not working, i think validate forms is server side
app.post("/register", catchAsync(async (req, res, next) => {
    try {
        console.log(req.body);
        const {email, username, password} = req.body;
        const user = new User({email, username});
        console.log(user);
        console.log(password);
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if(err) return next(err);
            req.flash("success", "Welcome to GoingBananasV2");
            res.redirect("/");
        })
    } catch(e) {
        console.log(e);
        req.flash("error", e.message);
        res.redirect("/register");
    }
}));

app.get("/login", (req, res) => {
    res.render("users/login");
});

app.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), (req, res) => {
    req.flash("success", "welcome back!");
    //console.log(req.user);
    //console.log(req.session);
    console.log(req.session.returnTo);
    const redirectUrl = (req.session.returnTo === "/login" || req.session.returnTo == null) ? "/" : req.session.returnTo;
    delete req.session.returnTo
    console.log("redirectUrl:" + redirectUrl);
    res.redirect(redirectUrl);
});

app.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Goodbye!");
    res.redirect('/');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
});
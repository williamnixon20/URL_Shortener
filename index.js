// Initialize dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
// Env variable, for mongoDB
require('dotenv').config();

// Try to connect to database
try {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
        console.log("Mongoose is connected.")
    });
} catch (error) {
    console.log("Error!");
}

// Make a schema, initialize model!
const urlSchema = new mongoose.Schema({
    url: String,
    slug: { type: String, unique: true },
})
let Url = mongoose.model('Url', urlSchema);

//Initialize app
const app = express();

//Initialize middlewares. Morgan is a logger and helmet is for security.
//Cors for cross-site access. Express.json to only accept json data.
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

// When accessed using an id parameter (slug), redirect user to the link in database! 
app.get('/:id', async (req, res, next) => {
    // Request params
    const { id: slug } = req.params;
    try {
        // Find url with the same slug in database
        const url = await Url.findOne({ slug: slug });
        if (url) {
            res.redirect(url.url);
        } else {
            res.redirect(`/?error=${slug} not found`);
        }
    } catch (error) {
        res.redirect(`/?error=Link not found`);
    }
});

// Validate strings using yup. Need to specify what to filter for.
const schema = yup.object().shape({
    slug: yup.string().trim().nullable().matches(/^[\w\-]+/i),
    url: yup.string().trim().url().required(),
})

// If POST request is sent here, add requested data to database.
app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    if (slug === "") {
        //console.log("slug is null");
        slug = null;
    }
    //console.log(url);
    try {
        // Validate input with yup
        await schema.validate({
            slug,
            url,
        });
        // If slug is null, generate a random one with nanoid.
        if (!slug) {
            slug = nanoid(6);
        }
        slug = slug.toLowerCase();
        // Create a new url object to add to mongoDB
        const newUrl = new Url({ url: url, slug: slug });
        // Try saving
        await newUrl.save((err, data, next) => {
            if (err) {
                res.json({ message: "Oops, slug is used!" });
            } else {
                res.json(newUrl);
            }
        });
    } catch (error) {
        next(error);
    }
})

// Error handler
app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'ok' : error.stack,
    })
})

// Port handler
const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})
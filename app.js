// src/app.js
const express = require('express');
const connectDB = require('./utils/db');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const roomRoutes = require('./src/routes/roomRoutes');
const dataroute = require('./src/routes/dataroute');
const RedirectRoute = require('./src/routes/RedirectRoute');
const MongoSessionStore = require('./utils/mongoSessionStore');
const securityHeaders = require('./utils/securityHeaders');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Hosts like Render sit behind a proxy that handles HTTPS; trust it so req.secure and req.ip reflect the
// visitor's real connection (needed for the secure session cookie and the rate limits).
// TRUST_PROXY = how many proxies sit in front of this server: 1 on Render alone (the default),
// 2 when the site goes through Netlify's /api proxy to Render.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.disable('x-powered-by'); // don't advertise Express

// Middleware setup
app.use(securityHeaders);
app.use(bodyParser.json({ limit: '1mb' })); // room for a profile photo upload


// Use the secret key from the environment variable
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
    console.error('SESSION_SECRET in .env must be set to a long random value (at least 16 characters) ❌');
    process.exit(1);
}

// Log users out after 20 minutes without activity; every request restarts the timer
const SESSION_IDLE_MS = 20 * 60 * 1000;

app.use(session({
    name: 'watcal.sid',
    secret: sessionSecret,
    store: new MongoSessionStore(), // sessions survive restarts (kept in MongoDB, removed when they expire)
    resave: false,
    saveUninitialized: false, // only create a session once someone logs in
    rolling: true,
    cookie: {
        maxAge: SESSION_IDLE_MS,
        httpOnly: true,
        sameSite: 'lax',
        secure: 'auto' // HTTPS-only cookie on the live site; still works on http://localhost
    }
}));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define the route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/pages/Home.jsx'));
});


// API routes
app.use('/api', require('./src/routes/tenantRoutes'));
app.use('/api', require('./src/routes/landlordRoutes'));
app.use('/api', roomRoutes);
app.use('/api', dataroute);
app.use('/api', RedirectRoute); // Integrate the RedirectRoute
app.use('/api', require('./src/routes/googleRoutes')); // "Continue with Google"
app.use('/api', require('./src/routes/meterRoutes'));  // readings sent by on-site meter devices

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`Server started on port ${PORT}`);
// });

// Export app
module.exports = app;

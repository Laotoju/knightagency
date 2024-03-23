const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const LogInCollection = require("./mongo");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure express-session middleware
app.use(session({
    secret: 'knighttravelagency',
    resave: false,
    saveUninitialized: true
}));

const templatePath = path.join(__dirname, '../templates');
const publicPath = path.join(__dirname, '../public');

app.set('view engine', 'hbs');
app.set('views', templatePath);
app.use(express.static(publicPath));

// Middleware for user authentication
const authenticateUser = async (req, res, next) => {
    try {
        // Check if user is logged in by checking session
        if (req.session.user) {
            // If user is logged in, continue to the next middleware
            next();
        } else {
            // If user is not logged in, redirect to login page
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/login');
    }
};

app.get('/register', (req, res) => {
    // Get query parameter from URL indicating registration status
    const registrationStatus = req.query.registration;
    let message = '';
    if (registrationStatus === 'success') {
        message = 'Registration successful! You can now login.';
    }
    res.render('register', { message });
});

app.get('/', (req, res) => {
    res.render('login');
});


app.get('/login', (req, res) => {
    // Assuming you have a session middleware to retrieve user information
    const user = req.session.user;
    res.render('login', { user });
});

// Route handler for the "/book" page
app.get('/book', authenticateUser, (req, res) => {
    // Get the logged-in user's name from the session
    const userName = req.session.user.name;
    // Render the "book" template with the user's name
    res.render('book', { name: userName });
});

app.post('/register', async (req, res) => {
    const data = {
        name: req.body.name,
        password: req.body.password
    }



    const checking = await LogInCollection.findOne({ name: req.body.name })

    try {
        if (checking && checking.name === req.body.name && checking.password === req.body.password) {
            res.send("User details already exist.")
        } else {
            await LogInCollection.insertMany([data]);
            // Redirect to login page with registration success query parameter
            res.redirect('/login?registration=true');
        }
    } catch {
        res.send("Wrong inputs");
    }
});

app.post('/book', authenticateUser, async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user._id;

        // Find user in the LogInCollection model by ID
        const user = await LogInCollection.findById(userId);

        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }
        
        // Create a new booking object from the form data
        const newBooking = {
            flight_number: req.body.flight_number,
            destination: req.body.destination,
            departure_date: req.body.departure_date,
            passenger_name: req.body.passenger_name,
            passport_number: req.body.passport_number,
            email: req.body.email,
            phone: req.body.phone
        };

        // Add the new booking to the user's bookings array
        user.bookings.push(newBooking);

        // Save the updated user object back to the database
        await user.save();

        // Redirect the user to the "/view" page after successful booking
        res.redirect('/view');
    } catch (error) {
        console.error("Error booking flight:", error);
        res.redirect('/book/error');
    }
});

app.get('/view', authenticateUser, async (req, res) => {
    try {
        console.log(req.session);
        // Get user ID from session
        const userId = req.session.user._id;

        // Find user in the LogInCollection model by ID
        const user = await LogInCollection.findById(userId);

        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }

        // Retrieve all bookings for the user
        const bookings = user.bookings;

        // Log the retrieved bookings for debugging
        console.log("User's bookings:", bookings);

        // Render the "view" page with the user's bookings
        res.render('view', { name: req.session.user.name, bookings });
    } catch (error) {
        console.error("Error retrieving bookings:", error);
        res.render('view', { error: 'An error occurred while retrieving bookings.' });
    }
});







app.post('/login', async (req, res) => {
    try {
        const check = await LogInCollection.findOne({ name: req.body.name })

        if (check && check.password === req.body.password) {
            // Store user data in session upon successful login
            req.session.user = check;
            // Redirect to the "/book" page
            res.redirect('/book');
        } else {
            res.send("Incorrect username or password! Go back to Login.");
        }
    } catch (e) {
        console.error("Error logging in:", e);
        res.send("An error occurred. Please try again later.");
    }
});



// Logout route
app.get('/logout', (req, res) => {
    // Destroy the session to log the user out
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect the user to the login page after logout
            res.redirect('/login');
        }
    });
});


app.listen(port, () => {
    console.log('Port connected');
});

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const Registration = require('./models/Registration');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/simple_kitchen', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set up Pug as view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static files from specific directories
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/scss', express.static(path.join(__dirname, 'scss')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Routes
app.get('/', (req, res) => {
  res.render('home', { title: 'Simple Kitchen' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.post('/register', 
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      const registration = new Registration(req.body);
      
      // generate salt to hash password
      const salt = await bcrypt.genSalt(10);
      // set user password to hashed password
      registration.password = await bcrypt.hash(registration.password, salt);
      
      await registration.save();
      res.render('thankyou', { title: 'Thank You' });
    } else {
      res.render('register', { 
        title: 'Register',
        errors: errors.array()
      });
    }
  }
);

app.get('/registrants', async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.render('registrants', { 
      title: 'Registrants',
      registrations: registrations
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;
// import the redirect url
const redirect_url = require('./redirect_url');
// Custom middleware function for logging requests, responses, and errors and passing control to the next middleware function in the request processing pipeline
function logRequests(req, res, next) {
  // Log the request to the console
  console.log(`${new Date()}: ${req.method} ${req.url}`);
  next();
}
// Custom middleware function for logging errors and passing control to the next middleware function in the request processing pipeline
function logErrors(err, req, res, next) {
  // Log the error to the console
  console.error(err.stack);
  next(err);
}
// custom middleware function for handling errors
function errorHandler(err, req, res, next) {
  // Check if the error is a 404 error
  if (err.status === 404) {
    return res.status(404).send('Not Found');
  }
  // Check if the error is a 500 error
  if (err.status === 500) {
    return res.status(500).send('Internal Server Error');
  }
  // If the error is not a 404 or 500 error, set the status code to 500
  res.status(500);
}

// Use the middleware function in the request processing pipeline
app.use(logRequests);
app.use(logErrors);
app.use(errorHandler);
//Sqlite database connection
db = new sqlite3.Database('./tastyb', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database.');
});

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
// Set up session middleware
app.use(session({
  secret: 'giantiss', // Change this to a secret string
  resave: false,
  saveUninitialized: true
}));
// Set up view engine
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/images', express.static(__dirname + 'public/images'));
app.use('/fonts', express.static(__dirname + 'public/fonts'));
app.use('/vendor', express.static(__dirname + 'public/vendor'));
app.use('/scss', express.static(__dirname + 'public/scss'));
// Middleware to create a cartCounter variable in all views
app.use((req, res, next) => {
  const cartItems = req.session.cartItems || [];
  const totalQuantity = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
  res.locals.cartCounter = totalQuantity || 0; // Ensure default value is set if totalQuantity is undefined
  next();
});

// Routes
app.get('/', (req, res) => {
  //get 5 foods from the database ordered by id
  db.all('SELECT * FROM foods ORDER BY id DESC LIMIT 5', (err, result) => {
    if(err) throw err;
    res.render('index', {foods: result});
  });
});

app.get('/menu', (req, res) => {
  //get all foods from the database ordered by id
  db.all('SELECT * FROM foods ORDER BY id DESC', (err, result) => {
    if(err) throw err;
    // render the menu page and pass the foods to it
    res.render('menu', {foods: result});
      });
});
// Function to calculate the total price of items in the cart
function calculateTotalPrice(cartItems) {
  let totalPrice = 0;
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].quantity && cartItems[i].price) {
      totalPrice += parseInt(cartItems[i].quantity) * parseFloat(cartItems[i].price);
    }
  }
  return totalPrice;
}

// Route to handle adding items to the cart
app.post('/add-to-cart', (req, res) => {
  const { id, title, price, quantity } = req.body;

  const cartItem = {
    id: id,
    title: title,
    price: price,
    quantity: quantity
  };

  if (!req.session.cartItems) {
    req.session.cartItems = [];
  }

  const existingItem = req.session.cartItems.find(item => item.id === cartItem.id);

  if (existingItem) {
    existingItem.quantity = parseInt(existingItem.quantity) + parseInt(cartItem.quantity);
  } else {
    req.session.cartItems.push(cartItem);
  }

  // Calculate total price of items in the cart and store in session
  req.session.totalPrice = calculateTotalPrice(req.session.cartItems);

  res.redirect('/menu');
});

// Route to display the cart
app.get('/cart', (req, res) => {
  const cartItems = req.session.cartItems || [];
  const totalPrice = req.session.totalPrice || 0;

  res.render('cart', { cartItems: cartItems, totalPrice: totalPrice });
});
  
// Route to handle removing items from the cart
app.post('/remove-item', (req, res) => {
  var id = req.body.id;
  cartItems = req.session.cartItems;

  for(let i = 0; i < cartItems.length; i++) {
    if(cartItems[i].id == id) {
      cartItems.splice(cartItems.indexOf(cartItems[i]), 1);
      break;
    }
  }
  // Recalculate total price
  req.session.totalPrice = calculateTotalPrice(req.session.cartItems);
  // Redirect back to cart
  res.redirect('/cart');
});

//other routes and configurations...
app.get('/checkout', (req, res) => {
  //get total price from session
  const totalPrice = req.session.totalPrice;
  //get the redirect url 
  // const redirect_url = redirect_url;
  //render the checkout page and pass the total price and redirect url to it
  res.render('checkout', {totalPrice, redirect_url});
});

// Start server
app.listen(port, () => {
  //console log a message when the server starts listening and the current date and time
  console.log(`${new Date()}: Server started on port ${port}`);
});

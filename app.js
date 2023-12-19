const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;
let checkoutEncrypt = require('@cellulant/checkout_encryption');

// Custom middleware function for logging requests
function logRequests(req, res, next) {
  console.log(`${new Date()}: ${req.method} ${req.url}`);
  next();
}

// Use the middleware function in the request processing pipeline
app.use(logRequests);



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
app.post('/checkout', (req, res) => {
// Initialize merchant variables
const accessKey = "4INFNjF4VY3iFSjDIYVSSZF4VFNSjVFaYjiVFFFNijN4FV4jjjjD04aaYajZ"
const IVKey = "3E9XVSxLiqDkeJdl";
const secretKey = "FiVjYS3F40ZaDIjN";
const algorithm = "aes-256-cbc";

  // encrypt the payload
var payloadobj = {
  "msisdn":"+254725135903",
  "account_number":"oid39",
  "country_code":"KEN",
  "currency_code":"KES",
  "due_date":"2024-01-01 00:00:00",
  "fail_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "merchant_transaction_id":"txn_id_342",
  "callback_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "request_amount":"100",
  "success_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "service_code":"YELLOWGEM",
}
const payloadStr = JSON.stringify(payloadobj);
  // Create object of the Encryption class  
  let encryption = new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm);
  // Encrypt the payload
   // call encrypt method
 var result = encryption.encrypt(payloadStr);
// redirect url
redirect_url = `https://online.uat.tingg.africa/testing/express/checkout?access_key=${accessKey}&encrypted_payload=${result}`;
 // print the result
 console.log(result);
 // render the result link to the checkout button
  res.render('checkout', {redirect_url: redirect_url});
});

// Start server
app.listen(port, () => {
  //console log a message when the server starts listening and the current date and time
  console.log(`${new Date()}: Server started on port ${port}`);
});

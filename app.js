const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;
let checkoutEncrypt = require('@cellulant/checkout_encryption');
require('dotenv').config();
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

//function to calculate the total items in the cart
function calculateTotalItems(cartItems) {
  // Initialize total items to 0
  let totalItems = 0;
  // Loop through the cart items and calculate the total items
  for (let i = 0; i < cartItems.length; i++) {
    // Check if the quantity is defined
    if (cartItems[i].quantity) {
      // Add the quantity to the total items
      totalItems += parseInt(cartItems[i].quantity);
    }
  }
  // Return the total items
  return totalItems;
}


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

// Route to display the index page
app.get('/', (req, res) => {
  //get 5 foods from the database ordered by id
  db.all('SELECT * FROM foods ORDER BY id DESC LIMIT 5', (err, result) => {
    if(err) throw err;
        //get total items in cart
        const cartItems = req.session.cartItems || [];
        // Calculate total items in the cart
        const totalItems = calculateTotalItems(cartItems);
        // render the index page and pass the foods and total items to it
        res.render('index', {foods: result, totalItems: totalItems});
  });
});

// Route to display the menu
app.get('/menu', (req, res) => {
  //get all foods from the database ordered by id
  db.all('SELECT * FROM foods ORDER BY id DESC', (err, result) => {
    if(err) throw err;
    //get total items in cart
    const cartItems = req.session.cartItems || [];
    // Calculate total items in the cart
    const totalItems = calculateTotalItems(cartItems);

    // render the menu page and pass the foods and total items to it
    res.render('menu', {foods: result, totalItems: totalItems});
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
  // Calculate total items in the cart
  const totalItems = calculateTotalItems(cartItems);
  // Render the cart page and pass the cart items, total items, and total price to it
  res.render('cart', {cartItems: cartItems, totalItems: totalItems, totalPrice: totalPrice});
});
  
// Route to handle removing items from the cart
app.post('/remove-item',(req , res) => {
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
//generate 6 digit random number
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Initialize merchant variables
const accessKey = process.env.ACCESS_KEY;
const IVKey = process.env.IV_KEY;
const secretKey = process.env.SECRET_KEY;
const algorithm = "aes-256-cbc";

// populate the payload
var payloadobj = {
  "msisdn":"+254718880078",
  "account_number":"oid39",
  "country_code":"KEN",
  "currency_code":"KES",
  "due_date":"2026-01-01 00:00:00",
  "fail_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  //TODO: change the merchant_transaction_id to a unique value prepend with y, m, d
  "merchant_transaction_id":getRandomInt(1000000),
  "callback_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "request_amount":req.session.totalPrice,
  "success_redirect_url":process.env.BASE_URL + "success",
  "service_code":"YELLOWGEM",
}
const payloadStr = JSON.stringify(payloadobj);
  // Create object of the Encryption class  
  let encryption = new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm);
  // Encrypt the payload by calling encrypt method
 var result = encryption.encrypt(payloadStr);
// redirect url
redirect_url = `https://online.uat.tingg.africa/testing/express/checkout?access_key=${accessKey}&encrypted_payload=${result}`;
  //clear the cart session
  req.session.cartItems = [];
  //render TINGG checkout page with the redirect url endpoint
  res.redirect(redirect_url);
});

//Route to handle successful checkout
app.post('/success', async (req, res) => {
  //Authenticate checkout Request
  //log the callback received from the checkout
  console.log("Callback Received", req.body)
//TODO: uncomment the code below to save the callback to the database
  // db.run(`CREATE TABLE IF NOT EXISTS payments(
  //   id INTEGER PRIMARY KEY AUTOINCREMENT,
  //   request_status_code INTEGER,
  //   merchant_transaction_id INTEGER,
  //   checkout_request_id INTEGER,
  //   service_code TEXT,
  //   account_number TEXT,
  //   currency_code TEXT,
  //   request_amount INTEGER,
  //   amount_paid INTEGER,
  //   payments TEXT,
  //   failed_payments TEXT,
  //   request_date TEXT,
  //   payment_status_description TEXT,
  //   msisdn TEXT,
  //   customer_email TEXT,
  //   request_description TEXT
  // )`);
  // //insert the callback received into the database
  // db.run(`INSERT INTO payments(request_status_code, merchant_transaction_id, checkout_request_id, service_code, account_number, currency_code, request_amount, amount_paid, payments, failed_payments, request_date, payment_status_description, msisdn, customer_email, request_description) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [req.body.request_status_code, req.body.merchant_transaction_id, req.body.checkout_request_id, req.body.service_code, req.body.account_number, req.body.currency_code, req.body.request_amount, req.body.amount_paid, req.body.payments, req.body.failed_payments, req.body.request_date, req.body.payment_status_description, req.body.msisdn, req.body.customer_email, req.body.request_description], (err) => {
  //   if(err) throw err;
  // });


  //Get request body details
  const request_status_code = req.body.request_status_code;
  const merchant_transaction_id = req.body.merchant_transaction_id;
  const checkout_request_id = req.body.checkout_request_id;
  const account_number = req.body.account_number;
  const currency_code = req.body.currency_code;
  const request_amount = req.body.request_amount;
  const amount_paid = req.body.amount_paid;
  const service_code = req.body.service_code;
  const payments = req.body.payments;
  const request_date = req.body.request_date;
  const payment_status_description = req.body.payment_status_description;
  const msisdn = req.body.msisdn;

  //authenticate the checkout request
  // Authentication request options
  const authOptions = {
    // define the request method, url, headers, and data
    method: 'POST',
    url: 'https://api-dev.tingg.africa/v1/oauth/token/request',
    headers: {
      accept: 'application/json',
      apikey: process.env.API_KEY, // Replace with your Tingg API key
      'content-type': 'application/json',
    },
    data: {
      client_id: process.env.CLIENT_ID, // Replace with your client ID
      client_secret: process.env.CLIENT_SECRET, // Replace with your client secret
      grant_type: 'client_credentials',
    },
  };
  // Make a POST request to authenticate and obtain an access token
  const authResponse = await axios(authOptions);
// use axios to make a post request to authenticate and obtain an access token  
axios
.request(authOptions)
// handle success
.then(function (response) {
  console.log(response.data);
})
// catch errors
.catch(function (error) {
  console.error(error);
});
  // Extract the access token from the authentication response
  const accessToken = authResponse.data.access_token;
  // Acknowledgement request options
  const acknowledgement = {
    // define the request method, url, headers, and data
    method: 'POST',
    url: 'https://api-dev.tingg.africa/v3/checkout-api/acknowledgement/request',
    headers: {
      accept: 'application/json',
      apikey: process.env.API_KEY, // Replace with your Tingg API key
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    data: {
      acknowledgement_amount: amount_paid,
      acknowledgement_type: 'Full',
      acknowledgement_narration: 'Tastebites payment acknowledgement',
      acknowledgment_reference: 'ACK80007',
      merchant_transaction_id: merchant_transaction_id,
      service_code: service_code,
      status_code: '183',
      currency_code: 'KES'
    }
  };
// use axios to make a post request to acknowledge the checkout request  
axios
.request(acknowledgement)
// handle success
.then(function (response) {
  console.log(response.data);
})
// catch errors
.catch(function (error) {
  console.error(error);
});
// render the success page and pass the request body details to it
  res.render('success', {
    request_status_code: request_status_code, 
    merchant_transaction_id: merchant_transaction_id, 
    checkout_request_id: checkout_request_id,
    account_number: account_number, 
    currency_code: currency_code, 
    request_amount: request_amount, 
    amount_paid: amount_paid, 
    payments: payments,
    request_date: request_date, 
    payment_status_description: payment_status_description, 
    msisdn: msisdn
  })
});
// Start server
app.listen(port, () => {
  //console log a message when the server starts listening and the current date and time
  console.log(`${new Date()}: Server started on port ${port}`);
});

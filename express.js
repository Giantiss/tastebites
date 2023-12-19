require('dotenv').config();

let checkoutEncrypt = require('@cellulant/checkout_encryption');
//generate 6 digit random number
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
// Initialize merchant variables
const accessKey = process.env.ACCESS_KEY;
const IVKey = process.env.IV_KEY;
const secretKey = process.env.SECRET_KEY;
const algorithm = "aes-256-cbc";

  // encrypt the payload
var payloadobj = {
  "msisdn":"+254725135903",
  "account_number":"oid39",
  "country_code":"KEN",
  "currency_code":"KES",
  "due_date":"2024-01-01 00:00:00",
  "fail_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "merchant_transaction_id":"002",
  "callback_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "request_amount":"100",
  "success_redirect_url":"https://tastebites-qioi.onrender.com/cart",
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
 console.log(redirect_url);
 //export the redirect url
  module.exports = redirect_url;

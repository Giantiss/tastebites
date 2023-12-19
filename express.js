let checkoutEncrypt = require('@cellulant/checkout_encryption');
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
 console.log(redirect_url);
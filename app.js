var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var db = new sqlite3.Database('StayConnected.db');

var host = "127.0.0.1";
var port = 3000;
var twilioAccountSid = "AC5ac5c103912388eca76424197a280ed8";
var twilioAuthToken = "426aaba89d4404270ac26ae42b1e0ae1";
var client = require('twilio')(twilioAccountSid, twilioAuthToken);

db.serialize(function(){
  // Create user table
  db.run("CREATE TABLE IF NOT EXISTS user (\
  id INTEGER PRIMARY KEY AUTOINCREMENT,\
  name TEXT NOT NULL, \
  email TEXT NOT NULL,\
  mobile TEXT NOT NULL,\
  password TEXT NOT NULL,\
  createdtime LONG NOT NULL,\
  UNIQUE(email) ON CONFLICT IGNORE)");

// Create otp table
  db.run("CREATE TABLE IF NOT EXISTS user_otp (\
  id INTEGER PRIMARY KEY AUTOINCREMENT,\
  email TEXT NOT NULL,\
  otp TEXT NOT NULL,\
  createdtime LONG NOT NULL,\
  UNIQUE(email) ON CONFLICT REPLACE)");

// Create user authentication table
  db.run("CREATE TABLE IF NOT EXISTS authentication (\
  id INTEGER PRIMARY KEY AUTOINCREMENT,\
  email TEXT NOT NULL,\
  token TEXT NOT NULL,\
  authenticated_time LONG NOT NULL,\
  UNIQUE(email) ON CONFLICT REPLACE)");

});

/**
* Test Request
*/
app.get("/", function(req,res){
  res.send("Welcome to StayConnected");
});

/**
* Listen for registration
* DB Reference : http://github.grumdrig.com/node-sqlite/ , https://gist.github.com/TravelingTechGuy/1117596
*/
app.post("/registration/",function(req,res){
  body = req.body
  var timestamp = new Date().getTime();

  // Check if user email id exists already
  db.get("SELECT id FROM user where email = "+"'"+ body.email +"'" , function(err, row) {
    if(row !== undefined){
      console.log("User exists Already");
      res.status(409);
      res.send('User exists Already');
    }
    else{
      db.run("INSERT INTO user(name, email, mobile, password, createdtime) VALUES\
      ('"+ body.name +"', '"+ body.email +"', '"+ body.mobile +"', '"+ body.password +"', '"+ timestamp +"')");

      response = {
          name:body.name,
          email:body.email,
          mobile:body.mobile,
          createdtime:timestamp
       };

       generateOTP(body.email, body.mobile)

       console.log(response);
       res.end(JSON.stringify(response));
    }
  });

 });

/**
* Listen to resend otp
*/
 app.get("/otp/resend", function(req,res){
   var email = req.param('email');
   console.log("Resend OTP for "+email);
     db.get("SELECT a.email, a.mobile, b.otp FROM user a LEFT JOIN user_otp b on a.email = b.email where a.email = "+"'"+ email +"'" , function(err, row) {
       if(err){
         console.log(err);
         console.log("User not registered");
         res.status(400);
         res.send('User not registered');
       }
       else if(row !== undefined){
         res.send("OTP send to the registered mobile number: "+row.mobile);
         sendOTP(row.otp, row.mobile)
       }
     });
 });

 /**
 * Listen to user OTP verification
 */
 app.post("/otp/verify/", function(req, res){
   body = req.body
   db.get("SELECT otp from user_otp where email = "+"'"+body.email +"'" , function(err, row){
     if(err){
       console.log(err);
       console.log("Error Verifying OTP");
       res.status(400);
       res.send("Error Verifying OTP");
     }
     else if(row == undefined){
       console.log("Invalid user");
       res.status(400);
       res.send("Invalid user");
     }
     else{
       if(row.otp == body.otp){
         res.send("Verified otp for "+body.email)
       }
       else{
         console.log("Invalid OTP for "+body.email);
         res.status(400);
         res.send("Invalid OTP");
       }
     }
   });
 });

 /**
 * Listen to user Login/Authentication
 */
 app.post("/login/", function(req, res){
   body = req.body
   var timestamp = new Date().getTime();

   // Check if user is registered
   db.get("SELECT * FROM user where email = "+"'"+ body.email +"'" , function(err, row) {
     if(err){
       console.log("Error Login :"+body.email);
       res.status(400);
       res.send("Error Login");
     }
     else if(row !== undefined){
       if(row.password == body.password){
         console.log(row.name+" Login sucessfull");
         res.send("Login sucessfull");
       }
       else {
         console.log("Incorrect password :"+body.email);
         res.status(400);
         res.send("Email and password does not match");
       }

     }
     else{
       console.log("Email does not exits :"+body.email);
       res.status(400);
       res.send("Email does not exits");
     }
   });

 });

// Generate and Send OTP for the registered user
 function generateOTP(email, mobile){
          var timestamp = new Date().getTime();
         var otp = Math.floor(100000 + Math.random() * 900000)
         otp = otp.toString().substring(0, 4);

         db.run("INSERT INTO user_otp(email, otp, createdtime) VALUES\
         ('"+ email +"', '"+ otp +"', '"+ timestamp +"')");

         sendOTP(otp, mobile);
 }

// Send the OTP to registered using Twilio
 function sendOTP(otp, mobile){
    client.messages.create({
     to: "+65" + mobile,
     from: "+12567438614",
     body: "Your verification code is "+otp,
 }, function(err, message) {
     console.log(" Twilio error "+err);
     console.log(" Twilio message "+message);
 });
 }


var server = app.listen(port, host);

console.log("StayConnected listening to port "+port)

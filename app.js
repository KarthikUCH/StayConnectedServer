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
  UNIQUE(EMAIL) ON CONFLICT IGNORE)");

// Create otp table
  db.run("CREATE TABLE IF NOT EXISTS user_otp (\
  id INTEGER PRIMARY KEY AUTOINCREMENT,\
  email TEXT NOT NULL,\
  otp TEXT NOT NULL,\
  createdtime LONG NOT NULL)");

// Create user authentication table
  db.run("CREATE TABLE IF NOT EXISTS authentication (\
  id INTEGER PRIMARY KEY AUTOINCREMENT,\
  email TEXT NOT NULL,\
  token TEXT NOT NULL,\
  authenticated_time LONG NOT NULL)");

});

/**
* Test Request
*/
app.get("/", function(req,res){
  res.send("Welcome to StayConnected");
})

/**
* Request for registration
* DB Reference : http://github.grumdrig.com/node-sqlite/ , https://gist.github.com/TravelingTechGuy/1117596
*/
app.post("/registration/",function(req,res){
  body = req.body
  var timestamp = new Date().getTime();
  var proceedRegistration = true;
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

// Generate OTP for the registered user
 function generateOTP(email, mobile){

          var timestamp = new Date().getTime();
         var otp = Math.floor(100000 + Math.random() * 900000)
         otp = otp.toString().substring(0, 4);

         db.run("INSERT INTO user_otp(email, otp, createdtime) VALUES\
         ('"+ email +"', '"+ otp +"', '"+ timestamp +"')");

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

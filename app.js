var express = require('express');

var app = express();
var host = "127.0.0.1";
var port = 3000;

app.get("/", function(req,res){
  res.send("Welcome to StayConnected")
})

var server = app.listen(port, host);

console.log("StayConnected listening to port "+port)

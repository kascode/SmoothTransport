/**
 * Created by kascode on 15.02.16.
 */

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ws = require('nodejs-websocket');

var routes = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

// Websocket
var wsServer = ws.createServer(function (connection) {
  console.log("New websocket connection");
  models.Vehicle.findAll()
    .then(function (vehicles) {
      var vehiclesArray = [];

      for (var i = 0; i < vehicles.length; i++) {
        var v = vehicles[i];
        vehiclesArray.push(v.get({plain: true}));
      }

      connection.sendText(JSON.stringify(vehiclesArray));
    });

  connection.on("text", function (str) {
    console.log("Received "+str);

    models.Vehicle.findAll()
      .then(function (vehicles) {
        var vehiclesArray = [];

        for (var i = 0; i < vehicles.length; i++) {
          var v = vehicles[i];
          vehiclesArray.push(v.get({plain: true}));
        }

        connection.sendText(JSON.stringify(vehiclesArray));
      });
  });
  connection.on('error', function (err) {
    console.error(err);
  });
  connection.on("close", function (code, reason) {
    console.log("Connection closed")
  });
}).listen(3061);

var proto = require('./proto.js');
var http = require('http');
var models = require('./models/index');

function getVehiclesData() {
  return new Promise((resolve, reject) => {
    models.Vehicle.truncate()
      .then(function () {
        http.get('http://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/realtime/vehicle', (res) => {
          //console.log(`Got response: ${res.statusCode}`);
          res.setEncoding('base64');
          var buf = '';
          res.on('data', function (data) {
            buf += data;
          });

          res.on('end', function () {
            var obj = proto.parse(buf);
            for (key in obj) {
              if (obj.hasOwnProperty(key)) {
                console.log(key);
              }
            }

            //console.log(obj.entity[0]);

            var res = [];

            for (var i = 0; i < obj.entity.length; i++) {
              var entity = obj.entity[i];
              if (entity.vehicle.vehicle.id == '3053') {
                res.push(entity);
                console.log(entity.vehicle);
              }
            }

            res = obj.entity;

            resolve(res);
          });
          res.resume();
        });
      });
    });
}

function generateVehicles(num) {
  var entities = [];

  while (num > entities.length) {
    entities.push(randomEntity());
  }

  return entities;
}

function saveVehicles(entities) {
  var vehicles = [];

  for (var i = 0; i < entities.length; i++) {
    var ent = entities[i];
    var vehicle = ent.vehicle;
    var v = {
      id: vehicle.vehicle.id,
      lat: vehicle.position.latitude,
      lng: vehicle.position.longitude,
      bearing: vehicle.position.bearing,
      speed: vehicle.position.speed,
      route_id: parseInt(vehicle.trip.route_id)
    };

    vehicles.push(v);
  }

  models.Vehicle.bulkCreate(vehicles).then(function (v) {
    console.log("Saved vehicles");

    sendDataToClients();
  });
}

function sendDataToClients() {
  if (wsServer && wsServer.connections) {
    wsServer.connections.forEach(function (c) {
      models.Vehicle.findAll()
        .then(function (vehicles) {
          var vehiclesArray = [];

          for (var i = 0; i < vehicles.length; i++) {
            var v = vehicles[i];
            vehiclesArray.push(v.get({plain: true}));
          }

          c.sendText(JSON.stringify(vehiclesArray));
        });
    })
  }
}

function randomEntity() {
  return {
    vehicle: {
      vehicle: {
        id: randomIntString(5)
      },
      position: {
        latitude: randomFloat(59.92, 60),
        longitude: randomFloat(30.25, 30.39),
        bearing: Math.floor(Math.random() * 100),
        speed: Math.floor(Math.random() * 100)
      },
      trip: {
        route_id: randomIntString(4)
      }
    }
  }
}

function randomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function randomIntString(length) {
  var text = "";
  var possible = "0123456789";
  for(var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function randomFloat(min, max) {
  do {
    var res = Math.random() + min;
  } while (res > max);

  return res;
}

//generateVehicles(20);
//setInterval(() => {
//  models.Vehicle.truncate()
//    .then(() => {
//      saveVehicles(generateVehicles(20))
//    });
//}, 5000);
setInterval(() => {
  models.Vehicle.truncate()
    .then(() => {
      getVehiclesData()
        .then((vehiclesData) => {
          saveVehicles(vehiclesData);
        })
    });
}, 4000);
//getVehiclesData();
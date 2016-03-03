/**
 * Created by kascode on 18.02.16.
 */

var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/', function (req, res) {
   models.Vehicle.findAll()
     .then(function (vehicles) {
       var vehiclesArray = [];

       for (var i = 0; i < vehicles.length; i++) {
         var v = vehicles[i];
         vehiclesArray.push(v.get({plain: true}));
       }

       res.send(vehiclesArray);
     });
});

module.exports = router;
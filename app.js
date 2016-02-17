/**
 * Created by kascode on 15.02.16.
 */

var proto = require('./proto.js');
var http = require('http');

http.get('http://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/realtime/vehicle?bbox=30.32,59.84,30.33,59.85&transports=bus,trolley', (res) => {
  console.log(`Got response: ${res.statusCode}`);
  res.setEncoding('base64');
  var buf = '';
  res.on('data', (data) => {
    buf += data;
  });

  res.on('end', () => {
    var obj = proto.parse(buf);
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        console.log(key);
      }
    }
    console.log(obj.entity[0]);
    //for (var i = 0; i < obj.entity.length; i++) {
    //  var ent = obj.entity[i];
    //  console.log(ent.vehicle.position);
    //}
  });
  res.resume();
});
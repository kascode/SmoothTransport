/**
 * Created by kascode on 17.02.16.
 */
var ProtoBuf = require('protobufjs'),
  builder = ProtoBuf.loadProtoFile("./gtfs-realtime.proto"),    // Creates the Builder
  RealtimeTransit = builder.build("transit_realtime");


module.exports.parse = function(proto) {
  return RealtimeTransit.FeedMessage.decode(proto);
};
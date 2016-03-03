/**
 * Created by kascode on 05.02.16.
 */

"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Vehicle", {
    lat: DataTypes.FLOAT,
    lng: DataTypes.FLOAT,
    id: { type: DataTypes.INTEGER, unique: true, primaryKey: true },
    route_id: DataTypes.INTEGER,
    bearing: DataTypes.INTEGER,
    speed: DataTypes.FLOAT
  });
};
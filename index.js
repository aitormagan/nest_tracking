const homebridge = require('homebridge/lib/api.js');
const Logger = require('homebridge/lib/logger.js').Logger;
const nest = require('homebridge-nest');
const InfluxDB = require('influx').InfluxDB;
const config = require('./config');

const homebridge_api = new homebridge.HomebridgeAPI();
const influx = new InfluxDB({
    host: config.influx.host,
    database: config.influx.database
});

const log = Logger.withPrefix("Nest");

homebridge_api.registerPlatform = function(name, type, constructor) {
    let nest_platform = new constructor(log, {googleAuth: config.auth}, null);
    nest_platform.accessories(function(res, err) {
        let thermostasts = res.filter(accessory => accessory.constructor.name == "NestThermostatAccessory");
        let points = [];
        thermostasts.forEach(thermostast => {
            points.push({
                measurement: 'temperature',
                fields: { value: thermostast.device.current_temperature },
                tags: { device_id: thermostast.device.device_id }
            });
            points.push({
                measurement: 'humidity',
                fields: { value: thermostast.device.current_humidity },
                tags: { device_id: thermostast.device.device_id }
            });
        });

        influx.writePoints(points).then(() => {
            process.exit(0);
        }).catch(err => {
            process.exit(1);
        });
    });
};

nest(homebridge_api);
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
        let thermostast = res[0];
        influx.writePoints([
            {
                measurement: 'temperature',
                fields: { value: thermostast.device.current_temperature },
            },
            {
                measurement: 'humidity',
                fields: { value: thermostast.device.current_humidity }
            }
        ]).then(() => {
            process.exit(0);
        }).catch(err => {
            process.exit(1);
        });
    });
};

nest(homebridge_api);
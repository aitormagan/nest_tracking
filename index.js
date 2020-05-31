const homebridge = require('homebridge/lib/api.js');
const nest = require('homebridge-nest');
const InfluxDB = require('influx').InfluxDB;
const config = require('./config');

const homebridge_api = new homebridge.HomebridgeAPI();
const influx = new InfluxDB({
    host: config.influx.host,
    database: config.influx.database
});

let log = function(text) {
};
log.error = log.debug = log.info = log.warn = log.warning = log.critical = log;

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
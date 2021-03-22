const homebridge = require('homebridge/lib/api.js');
const Logger = require('homebridge/lib/logger.js').Logger;
const nest = require('homebridge-nest');
const InfluxDB = require('influx').InfluxDB;
const config = require('./config');

const homebridgeApi = new homebridge.HomebridgeAPI();
const influx = new InfluxDB({
    host: config.influx.host,
    database: config.influx.database
});

const log = Logger.withPrefix("Nest");

homebridgeApi.registerPlatform = async function(name, type, constructor) {
    const nestPlatform = new constructor(log, {googleAuth: config.auth}, homebridgeApi);
    const conn = await nestPlatform.setupConnection(false, false);
    const points = [];
    await conn.subscribe({});
    await conn.observe({});

    const thermostats = conn.apiResponseToObjectTree(conn.currentState).devices.thermostats;    
    Object.keys(thermostats).forEach(deviceId => {
        const thermostat = thermostats[deviceId];
        points.push({
            measurement: 'temperature',
            fields: { value: thermostat.current_temperature },
            tags: { device_id: deviceId }
        });
        points.push({
            measurement: 'humidity',
            fields: { value: thermostat.current_humidity },
            tags: { device_id: deviceId }
        });
    });

    influx.writePoints(points).then(() => {
        process.exit(0);
    }).catch(err => {
        process.exit(1);
    });
};

nest(homebridgeApi);

setTimeout(process.exit.bind(this, 1), 30000);
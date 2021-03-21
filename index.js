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

homebridgeApi.registerPlatform = function(name, type, constructor) {
    const nestPlatform = new constructor(log, {googleAuth: config.auth}, homebridgeApi);

    homebridgeApi.registerPlatformAccessories = function(plugin, vendor, accessories) {
        const points = [];
        const thermostats = accessories.filter(accessory => {
            let serviceNames = accessory.services.map(service => service.constructor.name);
            return serviceNames.indexOf("Thermostat") >= 0;
        });

        thermostats.forEach(thermostat => {

            const accesoryInfoService = thermostat.services.find(service => service.constructor.name === "AccessoryInformation");
            const serialNumber = accesoryInfoService.characteristics.find(characteristic => characteristic.constructor.name === "SerialNumber");
            const thermostatService = thermostat.services.find(service => service.constructor.name === "Thermostat");
            const currentTemperature = thermostatService.characteristics.find(characteristic => characteristic.constructor.name === "CurrentTemperature");
            const currentHumidity = thermostatService.characteristics.find(characteristic => characteristic.constructor.name === "CurrentRelativeHumidity");

            points.push({
                measurement: 'temperature',
                fields: { value: currentTemperature.value },
                tags: { device_id: serialNumber.value }
            });
            points.push({
                measurement: 'humidity',
                fields: { value: currentHumidity.value },
                tags: { device_id: serialNumber.value }
            });
        });

        influx.writePoints(points).then(() => {
            process.exit(0);
        }).catch(err => {
            process.exit(1);
        });
    }

    homebridgeApi.emit("didFinishLaunching");
    
};

nest(homebridgeApi);

setTimeout(process.exit.bind(this, 1), 30000);
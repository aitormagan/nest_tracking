# Nest Thermostat Temperature Tracking

Script to save current Nest Thermostat temperature and humidity in InfluxDB. To do so, the scripts makes use of the [HomeBridge Nest extension](https://github.com/chrisjshull/homebridge-nest) in order to make it easy to access to the Nest services. Using crontab you can take measures periodically and view them using a Grafana dashboard. 

## Installation

Configuring the script is as easy as following these steps:

1. Install NodeJS v12+ on your system.
2. Install InfluxDB on your system.
3. Create a database in your Influx instance.
4. Download the script using git.
5. Install all the dependencies by running `npm install`. 
6. Modify the `config.js` file to include your Nest credentials. Follow the steps included in [this guide](https://github.com/chrisjshull/homebridge-nest#using-a-google-account) to obtain the `issueToken`, `cookies` and `apiKey` values.
7. Modify the `config.js` file to include your Influx host and database.
8. Run the script by executing `node index.js`.

## Automatization

To update your InfluxDB periodically with the latest information, you can use crontab. To do so, execute `crontab -e` and add the following line:

```bash
*/5 * * * * node <PATH>/nest_tracker/index.js >> /dev/null 2>&1
```

This will update the values every five minutes. You can change the periodicity by changing the initial number of the line. Don't forget to replace `<PATH>` by the real path where you have downloaded this repository.
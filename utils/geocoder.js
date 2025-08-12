const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'openstreetmap',
  language: 'en',
  formatter: null,
  apiKey: null,
  zoom: 10,
  https: true
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;

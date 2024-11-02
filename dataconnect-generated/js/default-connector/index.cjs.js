const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'proyectClothes',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;


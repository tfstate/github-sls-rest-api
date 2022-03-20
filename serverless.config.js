// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const { NODE_ENV } = process.env;
const envVars = NODE_ENV
  ? JSON.parse(fs.readFileSync(fs.openSync(`.scaffoldly/${NODE_ENV}/env-vars.json`)))
  : JSON.parse(fs.readFileSync(fs.openSync(`.scaffoldly/env-vars.json`)));

module.exports.apiGatewayDomain = envVars['api-gateway-domain'];
module.exports.stageDomain = envVars['stage-domain'];
module.exports.serviceName = envVars['service-name'];
module.exports.serviceSlug = envVars['service-slug'];

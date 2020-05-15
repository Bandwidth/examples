const checkBandwidthCredentials = () => {
    if (!process.env.BANDWIDTH_ACCOUNT_ID) {
      console.error("Please set the environmental variable: BANDWIDTH_ACCOUNT_ID");
      process.exit();
    }
    if (!process.env.BANDWIDTH_SITE_ID) {
      console.error("Please set the environmental variable: BANDWIDTH_SITE_ID");
      process.exit();
    }
    if (!process.env.BANDWIDTH_API_USERNAME) {
      console.error("Please set the environmental variable: BANDWIDTH_API_USERNAME");
      process.exit();
    }
    if (!process.env.BANDWIDTH_API_PASSWORD) {
      console.error("Please set the environmental variable: BANDWIDTH_API_PASSWORD");
      process.exit();
    }
  }
  
  checkBandwidthCredentials();
  
  module.exports.BANDWIDTH_ACCOUNT_ID   = process.env.BANDWIDTH_ACCOUNT_ID;
  module.exports.BANDWIDTH_SITE_ID      = process.env.BANDWIDTH_SITE_ID;
  module.exports.BANDWIDTH_API_USERNAME = process.env.BANDWIDTH_API_USERNAME;
  module.exports.BANDWIDTH_API_PASSWORD = process.env.BANDWIDTH_API_PASSWORD;

  module.exports.PORT                   = process.env.PORT || 3000;
  
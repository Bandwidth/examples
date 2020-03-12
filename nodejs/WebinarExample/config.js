const checkBandwidthCredentials = () => {
  if (!process.env.BANDWIDTH_ACCOUNT_ID) {
    console.error("Please set the environmental variable: BANDWIDTH_ACCOUNT_ID");
    process.exit();
  }
  if (!process.env.MESSAGING_API_TOKEN) {
    console.error("Please set the environmental variable: MESSAGING_API_TOKEN");
    process.exit();
  }
  if (!process.env.MESSAGING_API_SECRET) {
    console.error("Please set the environmental variable: MESSAGING_API_SECRET");
    process.exit();
  }
  if (!process.env.MESSAGING_APPLICATION_ID) {
    console.error("Please set the environmental variable: MESSAGING_APPLICATION_ID");
    process.exit();
  }
  if (!process.env.VOICE_API_USERNAME) {
    console.error("Please set the environmental variable: VOICE_API_USERNAME");
    process.exit();
  }
  if (!process.env.VOICE_API_PASSWORD) {
    console.error("Please set the environmental variable: VOICE_API_PASSWORD");
    process.exit();
  }
  if (!process.env.VOICE_APPLICATION_ID) {
    console.error("Please set the environmental variable: VOICE_APPLICATION_ID");
    process.exit();
  }
  if (!process.env.BASE_URL) {
    console.error("Please set the environmental variable: BASE_URL");
    process.exit();
  }
}

checkBandwidthCredentials();

module.exports.BANDWIDTH_ACCOUNT_ID     = process.env.BANDWIDTH_ACCOUNT_ID;
module.exports.MESSAGING_API_TOKEN      = process.env.MESSAGING_API_TOKEN;
module.exports.MESSAGING_API_SECRET     = process.env.MESSAGING_API_SECRET;
module.exports.MESSAGING_APPLICATION_ID = process.env.MESSAGING_APPLICATION_ID;
module.exports.VOICE_ACCOUNT_ID         = process.env.VOICE_ACCOUNT_ID;
module.exports.VOICE_API_USERNAME       = process.env.VOICE_API_USERNAME;
module.exports.VOICE_API_PASSWORD       = process.env.VOICE_API_PASSWORD;
module.exports.VOICE_APPLICATION_ID     = process.env.VOICE_APPLICATION_ID;
module.exports.BASE_URL                 = process.env.BASE_URL;
module.exports.PORT                     = process.env.PORT || 3000;

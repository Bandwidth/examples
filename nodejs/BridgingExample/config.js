
const checkBandwidthCredentials = () => {
  if (!process.env.BANDWIDTH_ACCOUNT_ID) {
    console.error("Please set the environmental variable: BANDWIDTH_ACCOUNT_ID");
    process.exit();
  }
  if (!process.env.BANDWIDTH_API_USER) {
    console.error("Please set the environmental variable: VOICE_API_USERNAME");
    process.exit();
  }
  if (!process.env.BANDWIDTH_API_PASSWORD) {
    console.error("Please set the environmental variable: VOICE_API_PASSWORD");
    process.exit();
  }
  if (!process.env.BANDWIDTH_VOICE_APPLICATION_ID) {
    console.error("Please set the environmental variable: VOICE_APPLICATION_ID");
    process.exit();
  }
  if (!process.env.PERSONAL_NUMBER) {
    console.error("Please set the environmental variable: VOICE_APPLICATION_ID");
    process.exit();
  }
  if (!process.env.BASE_URL) {
    console.error("Please set the environmental variable: BASE_URL");
    process.exit();
  }
}

checkBandwidthCredentials();

module.exports.BANDWIDTH_ACCOUNT_ID = process.env.BANDWIDTH_ACCOUNT_ID;
module.exports.BANDWIDTH_API_USERNAME = process.env.BANDWIDTH_API_USER;
module.exports.BANDWIDTH_API_PASSWORD = process.env.BANDWIDTH_API_PASSWORD;
module.exports.BANDWIDTH_VOICE_APPLICATION_ID = process.env.BANDWIDTH_VOICE_APPLICATION_ID;
module.exports.PERSONAL_NUMBER = process.env.PERSONAL_NUMBER;
module.exports.BASE_URL = process.env.BASE_URL;    //
module.exports.PORT = process.env.PORT || 5000;

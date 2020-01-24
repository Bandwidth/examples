/**
 * messaging.js
 *
 * A simple express app to demonstrate usage of Bandwidth's Messaging API and callbacks
 *
 * @copyright Bandwidth INC
 */
if (!process.env.MESSAGING_ACCOUNT_ID || !process.env.MESSAGING_API_TOKEN || !process.env.MESSAGING_API_SECRET
    || !process.env.MESSAGING_APPLICATION_ID) {
    console.log("Please set the MESSAGING environmental variables defined in the README");
    process.exit();
}

const BandwidthMessaging = require('@bandwidth/messaging');
BandwidthMessaging.Configuration.basicAuthUserName = process.env.MESSAGING_API_TOKEN;
BandwidthMessaging.Configuration.basicAuthPassword = process.env.MESSAGING_API_SECRET;
const messagingController = BandwidthMessaging.APIController;

const voice = require("./voice");

/*
 * A method for showing how to handle Bandwidth messaging callbacks.
 * For inbound SMS that contains the phrase "call me", a phone call is made and the user is asked to
 *      forward the call to another number
 * For inbound SMS that doesn't contain the phrase "call me", the response is a SMS with the date and time.
 * For inbound MMS with a media attachment, the response is the same
 *      media attachment sent through Bandwidth's media resource.
 * For all other events, the callback is logged to console
 */
exports.handleInboundMessage = function(req, res) {
    data = req.body;

    if (data[0]["type"] == "message-received") {
        if (data[0]["message"]["text"].includes("call me")) {
            voice.callMe(data[0]["message"]["from"], data[0]["message"]["to"][0]);
        }
    } else {
        console.log(data);
    }
}

/**
 * messaging.js
 *
 * A simple express app to demonstrate usage of Bandwidth's Messaging API and callbacks
 *
 * @copyright Bandwidth INC
 */

const BandwidthMessaging = require('@bandwidth/messaging');
const config = require('./config');
const voice = require("./voice");

const sendMessage = async message => {
    BandwidthMessaging.Configuration.basicAuthUserName = config.MESSAGING_API_TOKEN;
    BandwidthMessaging.Configuration.basicAuthPassword = config.MESSAGING_API_SECRET;
    const accountId = config.BANDWIDTH_ACCOUNT_ID;
    const messagingController = BandwidthMessaging.APIController;

    message.applicationId = config.MESSAGING_APPLICATION_ID;
    const messageRequest = new BandwidthMessaging.MessageRequest(message);
    const messageResponse = await messagingController.createMessage(accountId, messageRequest);
    return messageResponse;
}

const buildToArray = message => {
  const toNumbers = message.message.to;
  const index = toNumbers.indexOf(message.to);
  if (index > -1 ) {
    toNumbers.splice(index, 1);
  }
  toNumbers.push(message.message.from);
  return toNumbers;
};


/*
 * A method for showing how to handle Bandwidth messaging callbacks.
 * For inbound SMS that contains the phrase "call me", a phone call is made and the user is asked to
 *      forward the call to another number
 * For inbound SMS that doesn't contain the phrase "call me", the response is a SMS with the date and time.
 * For inbound MMS with a media attachment, the response is the same
 *      media attachment sent through Bandwidth's media resource.
 * For all other events, the callback is logged to console
 */
exports.handleMessageCallback = async function(req, res) {
    res.sendStatus(200);
    const message = req.body[0];
    const isDLR = (message.message.direction.toLowerCase() === 'out');
    if (isDLR) {
        console.log(`Callback Received for: MessageId: ${message.message.id}, status: ${message.description}`);
        return;
    }
    const messageText = (message.message.text).toLowerCase().trim();
    const messageRequest = {
        to: buildToArray(message),
        from: message.to
    };
    switch (messageText) {
        case "call me":
            const voiceResponse = await voice.callMe(message.message.from, message.to);
            return;
            break;
        case "dog":
            messageRequest.text  = '🐶';
            messageRequest.media = ["https://bw-demo.s3.amazonaws.com/dog.jpg"];
            break;
        default:
            messageRequest.text  = `The current date-time in milliseconds since the epoch is ${Date.now()}`;
            break;
    }
    try {
        const messageResponse = await sendMessage(messageRequest);
        console.log(`Message sent with Id: ${messageResponse.id}`);
    }
    catch (e) {
        console.log(`Error sending message to: ${messageRequest.to}`);
        console.log(e);
    }
    return;
}

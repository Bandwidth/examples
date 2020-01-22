/**
 * app.js
 *
 * A template to create Express apps that utilize Bandwidth's APIs
 *
 * @copyright Bandwidth INC
 */
if (!process.env.MESSAGING_ACCOUNT_ID || !process.env.MESSAGING_API_TOKEN || !process.env.MESSAGING_API_SECRET
        || !process.env.MESSAGING_APPLICATION_ID || !process.env.VOICE_ACCOUNT_ID || !process.env.VOICE_API_USERNAME
        || !process.env.VOICE_API_PASSWORD || !process.env.VOICE_APPLICATION_ID) {
    console.log("Please set the env defined in the README");
    process.exit();
}

const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

const BandwidthMessaging = require('@bandwidth/messaging');
BandwidthMessaging.Configuration.basicAuthUserName = process.env.MESSAGING_API_TOKEN;
BandwidthMessaging.Configuration.basicAuthPassword = process.env.MESSAGING_API_SECRET;
const messagingController = BandwidthMessaging.APIController;

const BandwidthVoice = require('@bandwidth/voice');
BandwidthVoice.Configuration.basicAuthUserName = process.env.VOICE_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = process.env.VOICE_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;

const BandwidthBxml = require('@bandwidth/bxml');

app.get('/', function (req, res) {
    res.send("hello world");
});

app.post('/create/message', function(req, res) {
    var data = req.body;
    var body = new BandwidthMessaging.MessageRequest({
        "applicationId" : process.env.MESSAGING_APPLICATION_ID,
        "to" : [data["to"]],
        "from" : data["from"],
        "text" : data["text"],
    });
    messagingController.createMessage(process.env.MESSAGING_ACCOUNT_ID, body);
    res.send("Send a text message");
});

app.post('/create/call', function(req, res) {
    var data = req.body;
    var body = new BandwidthVoice.ApiCreateCallRequest({
        "from" : data["from"],
        "to" : data["to"],
        "applicationId" : process.env.VOICE_APPLICATION_ID,
        "answerUrl" : data["answerUrl"],
        "answerMethod" : "POST",
        "callTimeout" : 30
    });
    voiceController.createCall(process.env.VOICE_ACCOUNT_ID, body)
    res.send("Create a phone call");
});

app.post('/callbacks/messaging', function(req, res) {
    var data = req.body;
    res.send("Handle messaging callback");
});

app.post('/callbacks/voice/inbound', function(req, res) {
    var data = req.body;
    res.send("Handle inbound voice callback");
});

app.post('/callbacks/voice/outbound', function(req, res) {
    var data = req.body;
    res.send("Handle outbound voice callback");
});

app.post('/bxml', function(req, res) {
    var data = req.body;
    var response = new BandwidthBxml.Response();
    //add more verbs here
    res.send(response.toBxml());
});



app.listen(port, () => console.log(`Bandwidth Emulator is now listening on port ${port}!`));

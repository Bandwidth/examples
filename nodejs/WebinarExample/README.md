<div align="center">

# Bandwidth Node Webinar App

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `npm install` to get started

## Usage

The following environmental variables need to be set

| Variable                   | Description                                         |
|:---------------------------|:----------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`     | Your Bandwidth Messaging account ID                 |
| `MESSAGING_API_TOKEN`      | Your Bandwidth Messaging API token                  |
| `MESSAGING_API_SECRET`     | Your Bandwidth Messaging API secret                 |
| `MESSAGING_APPLICATION_ID` | Your Bandwidth Messaging application ID             |
| `VOICE_API_USERNAME`       | Your Bandwidth Voice API username                   |
| `VOICE_API_PASSWORD`       | Your Bandwidth Voice API password                   |
| `VOICE_APPLICATION_ID`     | Your Bandwidth Voice application ID                 |
| `BASE_URL`                 | The base url of the server running this application |

## Callback URLs For Bandwidth Applications

| Callback Type          | URL                   |
|:-----------------------|:----------------------|
| Messaging Callback     | <url>/MessageCallback |
| Inbound Voice Callback | <url>/VoiceCallback   |

## Run The Server
Run the following command to start the server

```
npm start
```

You are now ready to text your Bandwidth phone number that is associated with the application

## What You Can Do

* Text your phone number `call me` and you will receive a phone call asking you to transfer the call via a 10 digit dtmf gather
* Text your phone number `dog` and you will recieve a picture of a dog sent back
* Text your phone number any phrase other than `call me` or `dog` and you will receive a response with the current date-time
* Call your phone number and you will be asked to play a game

---

# Tutorial
## Assumptions

* Have Bandwidth Account
* Have NodeJS Installed (along with NPM)
* Have [ngrok](https://ngrok.com) installed

## NPM

```bash
npm init
npm i @bandwidth/bxml
npm i @bandwidth/messaging
npm i @bandwidth/voice
npm i express
npm i dotenv

touch index.js
touch messaging.js
touch voice.js
touch config.js
touch .env
```

## Code-along

### Setup Index.js

Intial setup of express and bringing in config

```js
require('dotenv').config()

const express = require('express');
const config = require('./config');

const app = express();

app.use(express.json());

app.listen(config.PORT);
console.log(`Server listening on port ${config.PORT}`);
```

### Setup Config.js

Really using this as a helper to ensure we have the right environment variables set

```js
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
```

### Fire up Ngrok

Start up ngrok so we can get BASE_URL & create bandwidth resources

### Create Bandwidth Resources

* Dashboard.bandwidth.com
* Create messaging application
* Get messaging credentials
* Create voice application
* Get voice credentials
* Update `.env` file with ngrok, and bandwidth creds

### Fill out Messaging.js

Pull in config and declare the SDK

```js
const BandwidthMessaging = require('@bandwidth/messaging');
const config = require('./config');
```

### Create sendMessage function

We're going to create a small function to hold our client, accountId, creds and applicationId

```js
const sendMessage = async message => {
    BandwidthMessaging.Configuration.basicAuthUserName = config.MESSAGING_API_TOKEN;
    BandwidthMessaging.Configuration.basicAuthPassword = config.MESSAGING_API_SECRET;
    const messagingController = BandwidthMessaging.APIController;

    const accountId = config.BANDWIDTH_ACCOUNT_ID;
    message.applicationId = config.MESSAGING_APPLICATION_ID;
    const messageRequest = new BandwidthMessaging.MessageRequest(message);
    const messageResponse = await messagingController.createMessage(accountId, messageRequest);
    return messageResponse;
};
```

### Create callback Handler

```js
exports.handleMessageCallback = async function(req, res) {
    res.sendStatus(200);
    const message = req.body[0];
    return;
};
```

### Update index.js with the new path

```js
app.post('/MessageCallback', messaging.handleMessageCallback);
```

### Fill out some logic in the message handler

#### Check if message is DLR or inbound

```js
    const isDLR = (message.message.direction.toLowerCase() === 'out');
    if (isDLR) {
        console.log(`Callback Received for: MessageId: ${message.message.id}, status: ${message.description}`);
        return;
    }

```

#### Pull relevant information from the message

* https://dev.bandwidth.com/messaging/callbacks/incomingGroup.html
* `const messageText = (message.message.text).toLowerCase().trim();`
  * logic on text, so force to lowercase and remove beginning/end white spaces
* let's make it "future-proof" to work with group messages as well
  * need to build 'to' array

```js
const buildToArray = message => {
  const toNumbers = message.message.to;
  const index = toNumbers.indexOf(message.to);
  if (index > -1 ) {
    toNumbers.splice(index, 1);
  }
  toNumbers.push(message.message.from);
  return toNumbers;
};
```

#### Logic switch

* Call me = create call (voice) filled in later
* dog = dog mms
* anything else = respond with datetime
* go ahead and start building our message request with common information

```js
    const messageRequest = {
        to: buildToArray(message),
        from: message.to
    };
    switch (messageText) {
        case "call me":
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
```

#### Send message

At this point we can send a message

```js
    try {
        const messageResponse = await sendMessage(messageRequest);
        console.log(`Message sent with Id: ${messageResponse.id}`);
    }
    catch (e) {
        console.log(`Error sending message to: ${messageRequest.to}`);
        console.log(e);
    }
```

Entire message.js should look like this so far:

```js
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
};
```

### Setup Voice

#### Create controller and requires
```js
const BandwidthVoice = require('@bandwidth/voice');
const BandwidthBxml = require('@bandwidth/bxml');
const url = require('url');
const config = require('./config');

BandwidthVoice.Configuration.basicAuthUserName = config.VOICE_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = config.VOICE_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;
```

### Endpoints

Need to handle a few use-cases

* "Call Me" sms = create outbound call (https://dev.bandwidth.com/voice/methods/calls/postCalls.html)
  * Creates transfer from gather request
  * Handle answer event (https://dev.bandwidth.com/voice/bxml/callbacks/answer.html)
  * Handle gather event (https://dev.bandwidth.com/voice/bxml/callbacks/gather.html)
* Inbound call
  * Handle call init event (https://dev.bandwidth.com/voice/bxml/callbacks/initiate.html)
  * Handle Gather response (https://dev.bandwidth.com/voice/bxml/callbacks/gather.html)

#### Setup routes for inbound call first

```js
/*
 * A method for showing how to handle inbound Bandwidth voice callbacks. Returns BXML
 * to play a game on the phone pad
 *
 * @return {string} The generated BXML
 */
exports.handleInboundCall = (req, res) => {

};

/*
 * Callback endpoint that expects a gather callback. Plays an audio file based on if the answer to the
 * game is correct or incorrect
 *
 * @return {string} The generated BXML
 */
exports.endGatherGame = (req, res) => {

};
```

#### update index.js

```js
app.post('/VoiceCallback', voice.handleInboundCall);
app.post('/EndGatherGame', voice.endGatherGame);
```

### Handle inbound call

* build a sentence (https://dev.bandwidth.com/voice/bxml/verbs/speakSentence.html)
* Build a gather (https://dev.bandwidth.com/voice/bxml/verbs/gather.html)
* Respond to callback

```js
exports.handleInboundCall = (req, res) => {
    const speakSentence1 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence1.setSentence('Let\'s play a game!');
    speakSentence1.setVoice('susan');
    speakSentence1.setGender('female');
    speakSentence1.setLocale('en_US');

    const speakSentence2 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence2.setSentence('What is 9 + 2');
    speakSentence2.setVoice('susan');
    speakSentence2.setGender('female');
    speakSentence2.setLocale('en_US');

    const gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl('/EndGatherGame');
    gather.setMaxDigits(2);

    const response = new BandwidthBxml.Response();
    response.addVerb(speakSentence1);
    response.addVerb(speakSentence2);
    response.addVerb(gather);

    const bxml = response.toBxml();
    res.send(bxml);
};
```

### Handle response to gather

* Check digits
* Play success or failure based on input (https://dev.bandwidth.com/voice/bxml/verbs/playAudio.html)
* hangup call (https://dev.bandwidth.com/voice/bxml/verbs/hangup.html)

```js
exports.endGatherGame = (req, res) => {
    const data = req.body;
    const digits = data['digits'];
    const successFile = 'https://bw-demo.s3.amazonaws.com/tada.wav';
    const failFile = 'https://bw-demo.s3.amazonaws.com/fail.wav';

    const audioFile = (digits === '11') ? successFile : failFile;

    const playAudio = new BandwidthBxml.Verbs.PlayAudio();
    playAudio.setUrl(audioFile);

    const response = new BandwidthBxml.Response();
    response.addVerb(playAudio);

    const hangup = new BandwidthBxml.Verbs.Hangup();
    response.addVerb(hangup);


    const bxml = response.toBxml();
    res.send(bxml);
};
```

### Handle 'call me' texts

* create outbound call
* handle answer event

#### Create outbound call

```js
exports.callMe = async (to, from) => {
    const accountId = config.BANDWIDTH_ACCOUNT_ID;
    const applicationId = config.VOICE_APPLICATION_ID;
    const answerUrl = (new URL('/StartGatherTransfer', config.BASE_URL)).href;
    const body = new BandwidthVoice.ApiCreateCallRequest({
        from          : from,
        to            : to,
        applicationId : applicationId,
        answerUrl     : answerUrl,
        answerMethod  : 'POST',
        callTimeout   : 30
    });
    try {
        const callResponse = await voiceController.createCall(accountId, body);
        console.log(`Created outbound call with callId: ${callResponse.callId}`);
        return callResponse;
    } catch (e) {
        console.log('Error creating outbound call');
        console.log(e);
    }
};
```

#### Handle answer

```js
exports.startGatherTransfer = (req, res) => {
    const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence.setSentence('Who do you want to transfer this call to? Enter the 10 digit phone number');
    speakSentence.setVoice('susan');
    speakSentence.setGender('female');
    speakSentence.setLocale('en_US');

    const gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl('/EndGatherTransfer');
    gather.setMaxDigits(10);
    gather.setSpeakSentence(speakSentence);

    const response = new BandwidthBxml.Response();
    response.addVerb(gather);

    const bxml = response.toBxml();
    res.send(bxml);
};
```

#### Handle Gather

* create a transfer to the digits pressed during the call

```js
exports.endGatherTransfer = (req, res) => {
    const data = req.body;
    const phoneNumberString = `+1${data['digits']}`;

    const phoneNumber = new BandwidthBxml.Verbs.PhoneNumber();
    phoneNumber.setNumber(phoneNumberString);

    const transfer = new BandwidthBxml.Verbs.Transfer();
    transfer.addPhoneNumber(phoneNumber);

    const response = new BandwidthBxml.Response();
    response.addVerb(transfer);

    const bxml = response.toBxml();
    res.send(bxml);
};
```

#### Update Index.js

* Need to define routes in the index

```js
app.post('/StartGatherTransfer', voice.startGatherTransfer);
app.post('/EndGatherTransfer', voice.endGatherTransfer);
```

#### Update message.js

* In the switch statement, for "call me" add the voice call

```js
switch (messageText) {
        case "call me":
            const voiceResponse = await voice.callMe(message.message.from, message.to);
            return;
            break;
      //...
};
```

### Now voice.js should look like

```js
/**
 * voice.js
 *
 * A simple express app to demonstrate usage of Bandwidth's Voice API and callbacks
 *
 * @copyright Bandwidth INC
 */
const BandwidthVoice = require('@bandwidth/voice');
const BandwidthBxml = require('@bandwidth/bxml');
const url = require('url');
const config = require('./config');

BandwidthVoice.Configuration.basicAuthUserName = config.VOICE_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = config.VOICE_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;

/*
 * A method that creates an outbound call that collects BXML at an endpoint when answered
 *
 * @param {string} to The phone number to receive the call
 * @param {string} from The phone number to make the call
 */

exports.callMe = async (to, from) => {
    const accountId = config.BANDWIDTH_ACCOUNT_ID;
    const applicationId = config.VOICE_APPLICATION_ID;
    const answerUrl = (new URL('/StartGatherTransfer', config.BASE_URL)).href;
    const body = new BandwidthVoice.ApiCreateCallRequest({
        from          : from,
        to            : to,
        applicationId : applicationId,
        answerUrl     : answerUrl,
        answerMethod  : 'POST',
        callTimeout   : 30
    });
    try {
        const callResponse = await voiceController.createCall(accountId, body);
        console.log(`Created outbound call with callId: ${callResponse.callId}`);
        return callResponse;
    } catch (e) {
        console.log('Error creating outbound call');
        console.log(e);
    }
}

/*
 * A method that returns BXML for creating a gather on an outbound call
 *
 * @return {string} The generated BXML
 */
exports.startGatherTransfer = (req, res) => {
    const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence.setSentence('Who do you want to transfer this call to? Enter the 10 digit phone number');
    speakSentence.setVoice('susan');
    speakSentence.setGender('female');
    speakSentence.setLocale('en_US');

    const gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl('/EndGatherTransfer');
    gather.setMaxDigits(10);
    gather.setSpeakSentence(speakSentence);

    const response = new BandwidthBxml.Response();
    response.addVerb(gather);

    const bxml = response.toBxml();
    res.send(bxml);
}

/*
 * A method that receives a Gather callback from Bandwidth and creates a Transfer response
 *
 * @return {string} The generated BXML
 */
exports.endGatherTransfer = (req, res) => {
    const data = req.body;
    const phoneNumberString = `+1${data['digits']}`;

    const phoneNumber = new BandwidthBxml.Verbs.PhoneNumber();
    phoneNumber.setNumber(phoneNumberString);

    const transfer = new BandwidthBxml.Verbs.Transfer();
    transfer.addPhoneNumber(phoneNumber);

    const response = new BandwidthBxml.Response();
    response.addVerb(transfer);

    const bxml = response.toBxml();
    res.send(bxml);
}

/*
 * A method for showing how to handle inbound Bandwidth voice callbacks. Returns BXML
 * to play a game on the phone pad
 *
 * @return {string} The generated BXML
 */
exports.handleInboundCall = (req, res) => {
    const speakSentence1 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence1.setSentence('Let\'s play a game!');
    speakSentence1.setVoice('susan');
    speakSentence1.setGender('female');
    speakSentence1.setLocale('en_US');

    const speakSentence2 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence2.setSentence('What is 9 + 2');
    speakSentence2.setVoice('susan');
    speakSentence2.setGender('female');
    speakSentence2.setLocale('en_US');

    const gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl('/EndGatherGame');
    gather.setMaxDigits(2);

    const response = new BandwidthBxml.Response();
    response.addVerb(speakSentence1);
    response.addVerb(speakSentence2);
    response.addVerb(gather);

    const bxml = response.toBxml();
    res.send(bxml);
};

/*
 * Callback endpoint that expects a gather callback. Plays an audio file based on if the answer to the
 * game is correct or incorrect
 *
 * @return {string} The generated BXML
 */
exports.endGatherGame = (req, res) => {
    const data = req.body;
    const digits = data['digits'];
    const successFile = 'https://bw-demo.s3.amazonaws.com/tada.wav';
    const failFile = 'https://bw-demo.s3.amazonaws.com/fail.wav';

    const audioFile = (digits === '11') ? successFile : failFile;

    const playAudio = new BandwidthBxml.Verbs.PlayAudio();
    playAudio.setUrl(audioFile);

    const response = new BandwidthBxml.Response();
    response.addVerb(playAudio);

    const hangup = new BandwidthBxml.Verbs.Hangup();
    response.addVerb(hangup);


    const bxml = response.toBxml();
    res.send(bxml);
};

```


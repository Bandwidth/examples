/**
 * voice.js
 *
 * A simple express app to demonstrate usage of Bandwidth's Voice API and callbacks
 *
 * @copyright Bandwidth INC
 */
if (!process.env.VOICE_ACCOUNT_ID || !process.env.VOICE_API_USERNAME || !process.env.VOICE_API_PASSWORD
    || !process.env.VOICE_APPLICATION_ID || !process.env.BASE_URL) {
    console.log("Please set the VOICE environmental variables defined in the README");
    process.exit();
}

const BandwidthVoice = require('@bandwidth/voice');
BandwidthVoice.Configuration.basicAuthUserName = process.env.VOICE_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = process.env.VOICE_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;

const BandwidthBxml = require('@bandwidth/bxml');

/*
 * A method that creates an outbound call that collects BXML at an endpoint when answered
 *
 * @param {string} to The phone number to receive the call
 * @param {string} from The phone number to make the call
 */
exports.callMe = function(to, from) {
    var body = new BandwidthVoice.ApiCreateCallRequest({
        "from" : from,
        "to": to,
        "applicationId" : process.env.VOICE_APPLICATION_ID,
        "answerUrl" : process.env.BASE_URL + "/StartGatherTransfer",
        "answerMethod" : "POST",
        "callTimeout" : 30
    });
    voiceController.createCall(process.env.VOICE_ACCOUNT_ID, body, function(error, response, context) {
        console.log(error);
        console.log(response);
        console.log(context);
    });
}

/*
 * A method that returns BXML for creating a gather on an outbound call
 *
 * @return {string} The generated BXML
 */
exports.startGatherTransfer = function(req, res) {
    var speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence.setSentence("Who do you want to transfer this call to? Enter the 10 digit phone number");
    speakSentence.setVoice("susan");
    speakSentence.setGender("female");
    speakSentence.setLocale("en_US");

    var gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl("/EndGatherTransfer");
    gather.setMaxDigits(10);
    gather.setSpeakSentence(speakSentence);

    var response = new BandwidthBxml.Response();
    response.addVerb(gather);

    res.send(response.toBxml());
}

/*
 * A method that receives a Gather callback from Bandwidth and creates a Transfer response
 *
 * @return {string} The generated BXML
 */
exports.endGatherTransfer = function(req, res) {
    var data = req.body;    
    var phoneNumberString = "+1" + data["digits"];

    var phoneNumber = new BandwidthBxml.Verbs.PhoneNumber();
    phoneNumber.setNumber(phoneNumberString);

    var transfer = new BandwidthBxml.Verbs.Transfer();
    transfer.addPhoneNumber(phoneNumber);

    var response = new BandwidthBxml.Response();
    response.addVerb(transfer);

    res.send(response.toBxml());
}

/*
 * A method for showing how to handle inbound Bandwidth voice callbacks. Returns BXML
 * to play a game on the phone pad
 *
 * @return {string} The generated BXML
 */
exports.handleInboundCall = function(req, res) {
    var speakSentence1 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence1.setSentence("Let's play a game!");
    speakSentence1.setVoice("susan");
    speakSentence1.setGender("female");
    speakSentence1.setLocale("en_US");

    var speakSentence2 = new BandwidthBxml.Verbs.SpeakSentence();
    speakSentence2.setSentence("What is 9 + 2");
    speakSentence2.setVoice("susan");
    speakSentence2.setGender("female");
    speakSentence2.setLocale("en_US");

    var redirect = new BandwidthBxml.Verbs.Redirect();
    redirect.setRedirectUrl("/StartGatherGame");

    var response = new BandwidthBxml.Response();
    response.addVerb(speakSentence1);
    response.addVerb(speakSentence2);
    response.addVerb(redirect);

    res.send(response.toBxml());
}

/*
 * Callback endpoint that returns BXML for making a gather
 *
 * @return {string} The generated BXML
 */
exports.startGatherGame = function(req, res) {
    var gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl("/EndGatherGame");
    gather.setMaxDigits(2);

    var response = new BandwidthBxml.Response();
    response.addVerb(gather);

    res.send(response.toBxml());
}

/*
 * Callback endpoint that expects a gather callback. Plays an audio file based on if the answer to the
 * game is correct or incorrect
 *
 * @return {string} The generated BXML
 */
exports.endGatherGame = function(req, res) {
    var data = req.body;
    var digits = data["digits"];

    var url;

    if (digits == "11") {
        url = "https://www.kozco.com/tech/piano2.wav";
    }
    else {
        url = "";
    }

    var playAudio = new BandwidthBxml.Verbs.PlayAudio();
    playAudio.setUrl(url);

    var response = new BandwidthBxml.Response();
    response.addVerb(playAudio);

    res.send(response.toBxml());
}

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
const config = require('./config')

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
    console.log(body);
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

    const redirect = new BandwidthBxml.Verbs.Redirect();
    redirect.setRedirectUrl('/StartGatherGame');

    const response = new BandwidthBxml.Response();
    response.addVerb(speakSentence1);
    response.addVerb(speakSentence2);
    response.addVerb(redirect);

    const bxml = response.toBxml();
    res.send(bxml);
}

/*
 * Callback endpoint that returns BXML for making a gather
 *
 * @return {string} The generated BXML
 */
exports.startGatherGame = (req, res) => {
    const gather = new BandwidthBxml.Verbs.Gather();
    gather.setGatherUrl('/EndGatherGame');
    gather.setMaxDigits(2);

    const response = new BandwidthBxml.Response();
    response.addVerb(gather);

    const bxml = response.toBxml();
    res.send(bxml);
}

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
}

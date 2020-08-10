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
const RINGING_URL = 'https://bw-demo.s3.amazonaws.com/telephone-ring-04.wav';
const FORWARD_TO = config.PERSONAL_NUMBER;

BandwidthVoice.Configuration.basicAuthUserName = config.BANDWIDTH_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = config.BANDWIDTH_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;


/**
 * A method for showing how to handle inbound Bandwidth voice callbacks.
 * Plays a lot of ringing
 *
 * @return {string} The generated BXML
 */
exports.handleInboundCall = async (req, res) => {
  const event = req.body;
  const callIdA = event.callId

  const ringing = new BandwidthBxml.Verbs.PlayAudio();
  ringing.setUrl(RINGING_URL);

  const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
  speakSentence.setSentence("Connecting your call, please wait");
  speakSentence.setVoice("julie");

  const response = new BandwidthBxml.Response();
  response.addVerb(speakSentence);

  var i;
  for (i = 0; i <= 10; i++) {
    //add ringing verb to play to callee while we create the outbound call
      response.addVerb(ringing);
  }


  const bxml = response.toBxml();
  res.send(bxml);
  await createOutboundCall(FORWARD_TO, event.from, event.callId);
};


/**
 * Create the outbound call to our users personal number
 */
 const createOutboundCall = async (to, from, callIdA) => {
   const answerUrl = (new URL('/Outbound/Answer', config.BASE_URL)).href;
   const body = {
     from: from,
     to: to,
     applicationId: config.BANDWIDTH_VOICE_APPLICATION_ID,
     answerUrl: answerUrl,
     answerMethod: "POST",
     callTimeout: 15,    // end the call before it goes to voicemail
     tag: callIdA,
     disconnectUrl: (new URL('/Disconnect', config.BASE_URL)).href,
     disconnectMethod: "POST"
   }
   const callRequest = new BandwidthVoice.ApiCreateCallRequest(body);
   try {
     const response = await voiceController.createCall(config.BANDWIDTH_ACCOUNT_ID, callRequest);
     console.log('Created Call')
     console.log(response);
     return response;
   }
   catch (error) {
     console.log('Error creating outbound call Request');
     console.log(body);
     console.log(error);
   }
 }


/**
 * Handle the users response of the B-leg call
 *
 * @return {string} The generated BXML
 */
exports.handleOutboundCall = (req, res) => {
  const event = req.body;
  const tag = event.tag;
  if (event.eventType !== 'answer') {
    try {
        voiceController.modifyCall(config.BANDWIDTH_ACCOUNT_ID, tag, body);
        // update a leg of call to start recording
        var body = new BandwidthVoice.ApiModifyCallRequest({
        "redirectUrl": (new URL('/UpdateCall', config.BASE_URL)).href,
        "state": "active",
        "redirectMethod": "POST"
        });
    } catch (error) {
        console.error(error);
      }
    } else {
        const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
        speakSentence.setSentence("Please press 1 to accept the call or any other button to send to voicemail");
        speakSentence.setVoice("kate");

        const gather = new BandwidthBxml.Verbs.Gather();
        gather.setGatherUrl("/Outbound/Gather");
        gather.setTerminatingDigits("#");
        gather.setMaxDigits("1");
        gather.setFirstDigitTimeout(10);
        gather.setSpeakSentence(speakSentence);
        gather.setTag(tag);

        const response = new BandwidthBxml.Response();
        response.addVerb(gather);
        const bxml = response.toBxml();
        res.send(bxml);
  }
}


/**
 * Read the digits from the gather performed on the B-leg
 *
 * @return {string} The generated BXML
 */
exports.handleOutboundGather = (req, res) => {
  const event = req.body;
  const tag = event.tag;
  if (event.digits !== '1') {
    var body = new BandwidthVoice.ApiModifyCallRequest({
    "redirectUrl": (new URL('/UpdateCall', config.BASE_URL)).href,
    "state": "active",
    "redirectMethod": "POST"
    });
    try {
        var speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
        speakSentence.setSentence('We will send the caller to voicemail.');
        speakSentence.setVoice("kate");
        var hangup = new BandwidthBxml.Verbs.Hangup();
        var response = new BandwidthBxml.Response();
        response.addVerb(speakSentence);
        response.addVerb(hangup);
        const bxml = response.toBxml();
        res.send(bxml);
        voiceController.modifyCall(config.BANDWIDTH_ACCOUNT_ID, tag, body);
    } catch (error) {
        console.error(error);
    }
  } else {
      const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
      speakSentence.setSentence("The bridge will start now");
      speakSentence.setVoice("kate");
      const bridge = new BandwidthBxml.Verbs.Bridge();
      bridge.setCallId(tag);

      const response = new BandwidthBxml.Response();
      response.addVerb(speakSentence);
      response.addVerb(bridge);

      const bxml = response.toBxml();
      res.send(bxml);
 }
}


/**
 * Redirect the A-leg of the call to new BXML if a disconnect event is recieved
 */
exports.handleDisconnect = async (req, res) => {
  const event = req.body;
  const tag = event.tag;    // the Call ID of the original inbound call
  if(event.cause == 'timeout'){
    var body = new BandwidthVoice.ApiModifyCallRequest({
    "redirectUrl": (new URL('/UpdateCall', config.BASE_URL)).href,
    "state": "active",
    "redirectMethod": "POST"
    });

    try {
        await voiceController.modifyCall(config.BANDWIDTH_ACCOUNT_ID, tag, body);
    } catch (error) {
        console.error(error);
    }
  }
}


/**
 * Update the A-leg to record a voicemail
 */
exports.updateCall = (req, res) => {
  const event = req.body;
  var speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
  speakSentence.setSentence("User is not available, leave your message at the tone");
  speakSentence.setVoice("julie");

  var playAudio = new BandwidthBxml.Verbs.PlayAudio();
  playAudio.setUrl("https://audio.url/beep.wav");

  var record = new BandwidthBxml.Verbs.Record();
  // record.setRecordCompleteUrl("https://myapp.com/nextBXML"); // optional
  record.setMaxDuration(20);

  var response = new BandwidthBxml.Response();
  response.addVerb(speakSentence);
  // response.addVerb(playAudio);
  // response.addVerb(record);
  const bxml = response.toBxml();
  res.send(bxml);
}

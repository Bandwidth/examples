/**
 * voice.js
 *
 * A simple express app to demonstrate usage of Bandwidth's Voice API and callbacks
 *
 * @copyright Bandwidth INC
 */

const RINGING_URL = 'https://bw-demo.s3.amazonaws.com/telephone-ring-04.wav';
const FORWARD_TO = '+';
const BandwidthVoice = require('@bandwidth/voice');
const BandwidthBxml = require('@bandwidth/bxml');
const url = require('url');
const config = require('./config');

BandwidthVoice.Configuration.basicAuthUserName = config.BANDWIDTH_API_USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = config.BANDWIDTH_API_PASSWORD;
const voiceController = BandwidthVoice.APIController;

/*
 * A method for showing how to handle inbound Bandwidth voice callbacks.
 * Plays a lot of ringing
 *
 * @return {string} The generated BXML
 */
exports.handleInboundCall = async (req, res) => {

  const event = req.body;

  const ringing = new BandwidthBxml.Verbs.PlayAudio();
  ringing.setUrl(RINGING_URL);

  const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
  speakSentence.setSentence("Connecting your call, please wait");
  speakSentence.setVoice("julie");

  const response = new BandwidthBxml.Response();
  response.addVerb(speakSentence);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);
  response.addVerb(ringing);

  const bxml = response.toBxml();
  res.send(bxml);
  await createOutboundCall(FORWARD_TO, event.from, event.callId);
};

const createOutboundCall = async (to, from, callId) => {
  const answerUrl = (new URL('/Outbound/Answer', config.BASE_URL)).href;
  const body = {
    from: from,
    to: to,
    applicationId: config.BANDWIDTH_VOICE_APPLICATION_ID,
    answerUrl: answerUrl,
    answerMethod: "POST",
    callTimeout: 15,
    tag: callId,
    //disconnectUrl: need this to handle what happens if they hangup after they answer
  }
  const callRequest = new BandwidthVoice.ApiCreateCallRequest(body);
  try {
    const response = await voiceController.createCall(config.BANDWIDTH_ACCOUNT_ID, callRequest);
    console.log(response);
    return response;
  }
  catch (error) {
    console.log('Error creating outbound call Request');
    console.log(body);
    console.log(error);
  }
}

const sendInboundCallerToVoicemail = async callId => {
  // update the callID to redirect to us
}



exports.handleOutboundCall = (req, res) => {
  const event = req.body;
  const tag = event.tag;
  if (event.eventType !== 'answer') {
    // you will update the OG call to redirect to capture voicemail
    return;
  }
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

exports.handleOutboundGather = (req, res) => {
  const event = req.body;
  const tag = event.tag;
  if (event.digits !== '1') {
    // send to voicemail
    return;
  }
  const speakSentence = new BandwidthBxml.Verbs.SpeakSentence();
  speakSentence.setSentence("The bridge will start now");
  const bridge = new BandwidthBxml.Verbs.Bridge();
  bridge.setCallId(tag);

  const response = new BandwidthBxml.Response();
  response.addVerb(speakSentence);
  response.addVerb(bridge);

  const bxml = response.toBxml();
  res.send(bxml);
}
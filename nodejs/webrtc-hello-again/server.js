const fs = require('fs')
const express = require('express')
const BandwidthWebRTC = require('@bandwidth/webrtc')
const BandwidthVoice  = require('@bandwidth/voice')
const uuid = require('uuid');
const dotenv = require('dotenv').config()
const jwt_decode = require('jwt-decode')
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(express.static('public'))

// config
const port = 3000
const localDir = __dirname
const accountId = process.env.ACCOUNT_ID

// Global variables
BandwidthWebRTC.Configuration.basicAuthUserName = process.env.USERNAME;
BandwidthWebRTC.Configuration.basicAuthPassword = process.env.PASSWORD;
var webRTCController = BandwidthWebRTC.APIController;

BandwidthVoice.Configuration.basicAuthUserName = process.env.USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = process.env.PASSWORD;
var voiceController = BandwidthVoice.APIController;

// create a map of PSTN calls that will persist
let calls = new Map()

// track out session ID
let sessionId = false;
let callId = false;


/**
 * Setup the call and pass info to the browser so they can join
 */
app.get('/startBrowserCall', (req, res) => {
  // create the session
  var sessionBody = new BandwidthWebRTC.Session({ "tag" : "session-test"});

  webRTCController.createSession(accountId, sessionBody, function(error, sessionResponse, context) {
    saveSessionId(sessionResponse.id)

    // create a participant for this browser user
    var participantBody = new BandwidthWebRTC.Participant(
      {
        "tag" : uuid.v1(),
        "publishPermissions" : ["AUDIO"]
      });

    webRTCController.createParticipant(accountId, participantBody, 
      function(error, createResponse, context) {
        // console.log("participant response info: ", createResponse)
        var body = new BandwidthWebRTC.Subscriptions({"sessionId" : getSessionId()});
        webRTCController.addParticipantToSession(accountId, getSessionId(), createResponse.participant.id, body, 
          function(error, response, context) {
            // now that we have added them to the session, we can send back the token they need to join
            console.log("sending token to web participant")
            res.send({token: createResponse.token});
        }).catch(error => {
          console.error('Error in addParticipantToSession:', error);
          res.status(500).send({"status":"Failed to add participant to session"})

      });

    }).catch(error => {
      console.error('Error in createParticipant:', error);
      res.status(500).send({"status":"Failed to create Participant and get token"})
    });
  }).catch(error => {
    console.error('Error in createSession:', error);
    res.status(500).send({"status":"Failed to create session"})
  });
});

/** 
 * Start the Phone Call
 */
app.get('/startPSTNCall', async (req, res) => {
  if (getSessionId() == false){
    console.log("No web browser in session; aborting PSTN call")
    res.status(400).send({"status":"Failed to start PSTN call; no session id found"})
    return;
  }
  console.log("about to create participant")
  // create a participant for this browser user
  var participantBody = new BandwidthWebRTC.Participant(
    {
      "tag" : uuid.v1(), 
      "publishPermissions" : ["AUDIO"]
    });

  webRTCController.createParticipant(accountId, participantBody, 
    async function(error, createResponse, context) {      
      let participant_response = createResponse
      PSTNToken = createResponse.token;
      
      var body = new BandwidthWebRTC.Subscriptions({"sessionId" : getSessionId()});
      console.log("Add PSTN caller to the session")
      webRTCController.addParticipantToSession(accountId, getSessionId(), createResponse.participant.id, body, 
        function(error, response, context) {
      }).catch(error => {
        console.error('Error in addParticipantToSession:', error);
        res.status(500).send({"status":"Failed to add PSTN call to session"})
      });

      var body = new BandwidthVoice.ApiCreateCallRequest({
        "from": process.env.FROM_NUMBER,
        "to": process.env.OUTBOUND_PHONE_NUMBER,
        "applicationId": process.env.VOICE_APPLICATION_ID,
        "answerUrl": process.env.BASE_CALLBACK_URL + 'callAnswered',
        "answerMethod": "POST"
      });

      console.log("start the call to", process.env.OUTBOUND_PHONE_NUMBER)
      try{
        var response = await voiceController.createCall(accountId, body)
        callId = response.callId;
        calls.set(response.callId, participant_response)
        res.send({"status":"ringing"})
  
      } catch (e) {
        console.error(`error calling ${process.env.OUTBOUND_PHONE_NUMBER}`, e);

        res.status(500).send({"status":"call failed"})
      }
  }).catch(error => {
    console.error('Error in createParticipant:', error);
    res.status(500).send({"status":"Failed to get token"})
  });
});

/**
 * Bandwidth's Voice API will hit this endpoint when an outgoing call is answered
 */
app.post("/callAnswered", async (req, res) => {
  const callId = req.body.callId;
  console.log(`received answered callback for call ${callId} tp ${req.body.to}`);

  const participant = calls.get(callId);
  if (!participant) {
    console.log(`no participant found for ${callId}!`);
    res.status(400).send();
    return;
  }

  // This is the response payload that we will send back to the Voice API to transfer the call into the WebRTC session
  // Use the SDK to generate this BXML
  // const bxml = webRTCController.generateTransferBxml(participant.token);
  // Use an internal function to generate the BXML
  const bxml = generateTransferBxml(participant.token);
  console.log(`transferring call ${callId} to session ${sessionId}`)

  // Send the payload back to the Voice API
  res.contentType("application/xml").send(bxml);
  console.log("transferred")
});

/** 
 * End the Phone Call
 */
app.get('/endPSTNCall', async (req, res) => {
  if (getSessionId() == false || callId == false){
    console.log("No session found; can't end PSTN call")
    res.status(400).send({"status":"Failed to end PSTN call; no session id found"})
    return;
  }

  var body = new BandwidthVoice.ApiModifyCallRequest({"state": "completed"});
  try{
    var response = await voiceController.modifyCall(accountId, callId, body)
    res.send({"status":"hungup"})

  } catch (e) {
    console.log(`error hanging up ${process.env.OUTBOUND_PHONE_NUMBER}:`, e);
    res.status(500).send({"status":"call hangup failed"}')
  }
});

/** 
 * start our server
 */
app.listen(port, () => {
  console.log(`Example app listening on port  http://localhost:${port}`)
});

/**
 * @param {sessionId} session_id
 */
function saveSessionId (session_id){
  // saved globally for speed of demo
  sessionId = session_id;
}
function getSessionId(){
  return sessionId;
}

/**
 * Helper method to generate transfer BXML from a WebRTC device token
 * @param deviceToken device token received from the call control API for a participant
 */
function generateTransferBxml (deviceToken){
  //Get the tid out of the participant jwt
  var decoded = jwt_decode(deviceToken);
  console.log("decoded tid is ", decoded.tid, "to SIPX:", process.env.BANDWIDTH_WEBRTC_SIPX_PHONE_NUMBER)

  var numberBXML = `<?xml version="1.0" encoding="UTF-8" ?>
    <Response>
      <SpeakSentence voice="julie">Transferring your call</SpeakSentence>
      <Transfer transferCallerId="${decoded.tid}"><PhoneNumber>${process.env.BANDWIDTH_WEBRTC_SIPX_PHONE_NUMBER}</PhoneNumber></Transfer>
      <SpeakSentence voice="julie">End of your call</SpeakSentence>
    </Response>`;

  return numberBXML;
};
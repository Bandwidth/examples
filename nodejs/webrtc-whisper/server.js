const fs = require("fs");
const express = require("express");
const BandwidthWebRTC = require("@bandwidth/webrtc");
const BandwidthVoice = require("@bandwidth/voice");
const uuid = require("uuid");
const dotenv = require("dotenv").config();
const jwt_decode = require("jwt-decode");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(express.static("public"));

// config
const port = 3000;
const accountId = process.env.ACCOUNT_ID;

const DEBUG = false;

// Global variables
BandwidthWebRTC.Configuration.basicAuthUserName = process.env.USERNAME;
BandwidthWebRTC.Configuration.basicAuthPassword = process.env.PASSWORD;
var webRTCController = BandwidthWebRTC.APIController;

BandwidthVoice.Configuration.basicAuthUserName = process.env.USERNAME;
BandwidthVoice.Configuration.basicAuthPassword = process.env.PASSWORD;
var voiceController = BandwidthVoice.APIController;

// create a map of PSTN calls that will persist
let calls = new Map();

// create an Map of users
//  participant_id -> { role: role, participant_id: participant_id }
let users = new Map();

// track our session ID and phone call Id
//  - if not a demo, these would be stored in persistant storage
let sessionId = false;
let callId = false;

let roleMap = { manager: [], employee: [], guest: [] };
let validRoles = ["employee", "manager", "guest"];

/**
 * Setup the call and pass info to the browser so they can join
 */
app.post("/startBrowserCall", async (req, res) => {
  console.log(`setup browser client for role of: ${req.query.role}`);
  if (!validRoles.includes(req.query.role)) {
    console.log(`Bad role passed in :${req.query.role}`);
    res.status(401).send({ message: `${req.query.role} is not a valid role` });
    return;
  }

  try {
    // get/create the session
    let session_id = await getSessionId(accountId, "session-test");

    let [participant, token] = await createParticipant(accountId, uuid.v1());

    await updateSubscriptions(
      accountId,
      participant.id,
      req.query.role,
      session_id,
      true
    );
    // now that we have added them to the session, we can send back the token they need to join
    res.send({
      message: "created particpant and setup session",
      token: token,
      session_id: session_id,
      participant_id: participant.id,
      role: req.query.role,
    });
  } catch (error) {
    console.log("Failed to start the browser call:", error);
    res.status(500).send({ message: "failed to set up participant" });
  }
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Demote a manager to an employee so they can speak to everyone
 */
app.get("/barge", async (req, res) => {
  console.log(
    `set part# ${req.query.participant} for role of: ${req.query.state}`
  );

  let session_id = await getSessionId(accountId, "session-test");

  if (req.query.state == "barge") {
    role = "employee";
  } else {
    role = "manager";
  }

  try {
    await updateSubscriptions(
      accountId,
      req.query.participant,
      role,
      session_id,
      false
    );
  } catch (error) {
    console.log("Failed to get you barged:", error);
    res.status(500).send({
      message: `failed to go to change state`,
    });
  }
});

/**
 * Start the Phone Call
 */
app.get("/startPSTNCall", async (req, res) => {
  try {
    session_id = await getSessionId();

    let [participant, token] = await createParticipant(
      accountId,
      process.env.OUTBOUND_PHONE_NUMBER
    );

    console.log("start the PSTN call to", process.env.OUTBOUND_PHONE_NUMBER);
    callResponse = await initiateCallToPSTN(
      accountId,
      process.env.FROM_NUMBER,
      process.env.OUTBOUND_PHONE_NUMBER
    );

    // store the token with the participant for later use
    participant.token = token;
    callId = callResponse.callId;

    calls.set(callResponse.callId, participant);
    res.send({ status: "ringing" });
  } catch (error) {
    console.log("Failed to start PSTN call:", error);
    res.status(500).send({ message: "failed to set up PSTN call" });
  }
});

/**
 * Bandwidth's Voice API will hit this endpoint when an outgoing call is answered
 */
app.post("/callAnswered", async (req, res) => {
  console.log(
    `received answered callback for call ${callId} to ${req.body.to}`
  );
  session_id = await getSessionId();

  const participant = calls.get(callId);
  if (!participant) {
    console.log(`no participant found for ${callId}!`);
    res.status(200).send(); // have to return 200 to the BAND server
    return;
  }

  // update the list of users, and role map
  //  we are always adding a caller as a guest for now
  await updateSubscriptions(
    accountId,
    participant.id,
    "guest",
    session_id,
    true
  );

  // This is the response payload that we will send back to the Voice API to transfer the call into the WebRTC session
  // Use the SDK to generate this BXML
  // ToDo: get the sessionId use out of here, maybe by placing it with "calls"
  console.log(`transferring call ${callId} to session ${sessionId}`);
  const bxml = webRTCController.generateTransferBxml(participant.token);

  // Send the payload back to the Voice API
  res.contentType("application/xml").send(bxml);
  console.log("transferred");
});

/**
 * End the Phone Call
 */
app.get("/endPSTNCall", async (req, res) => {
  console.log("Hanging up PSTN call");
  try {
    session_id = await getSessionId();

    await endCallToPSTN(accountId, callId);
    res.send({ status: "hungup" });
  } catch (error) {
    console.log(
      `error hanging up ${process.env.OUTBOUND_PHONE_NUMBER}:`,
      error
    );
    res.status(500).send({ status: "call hangup failed" });
  }
});

/**
 * start our server
 */
app.listen(port, () => {
  console.log(`Example app listening on port  http://localhost:${port}`);
});

// ------------------------------------------------------------------------------------------
// All the functions for interacting with Bandwidth WebRTC services below here
//
/**
 * @param session_id
 */
function saveSessionId(session_id) {
  // saved globally for simplicity of demo
  sessionId = session_id;
}
/**
 * Return the session id
 * This will either create one via the API, or return the one already created for this session
 * @param account_id
 * @param tag
 * @return a Session id
 */
async function getSessionId(account_id, tag) {
  // check if we've already created a session for this call
  //  - this is a simplification we're doing for this demo
  if (sessionId) {
    return sessionId;
  }

  console.log("No session found, creating one");
  // otherwise, create the session
  // tags are useful to audit or manage billing records
  var sessionBody = new BandwidthWebRTC.Session({ tag: tag });

  try {
    let sessionResponse = await webRTCController.createSession(
      account_id,
      sessionBody
    );
    // saves it for future use, this would normally be stored with meeting/call/appt details
    saveSessionId(sessionResponse.id);
    console.log(`session id created: ${sessionResponse.id}`);
    return sessionResponse.id;
  } catch (error) {
    console.log("Failed to create session:", error);
    throw new Error(
      "Error in createSession, error from BAND:" + error.errorMessage
    );
  }
}

/**
 *  Create a new participant
 * @param account_id
 * @param tag to tag the participant with, no PII should be placed here
 * @return list: (a Participant json object, the participant token)
 */
async function createParticipant(account_id, tag) {
  // create a participant for this browser user
  var participantBody = new BandwidthWebRTC.Participant({
    tag: tag,
    publishPermissions: ["AUDIO"],
  });

  try {
    let createResponse = await webRTCController.createParticipant(
      accountId,
      participantBody
    );

    return [createResponse.participant, createResponse.token];
  } catch (error) {
    console.log("failed to create Participant", error);
    throw new Error(
      "Failed to createParticipant, error from BAND:" + error.errorMessage
    );
  }
}

/**
 * Update the subscriptions for the session, when a new person is added we need to update all
 * subscriptions based on the role of the new person and the roles of those already in session
 * @param account_id The id for this account
 * @param participant_id the Participant who is subscribing
 * @param role the role of this participant, which dictates to whom they will be subscribed
 * @param session_id the session these participants are in
 * @param participant_is_new true if the participant in question is new
 */
async function updateSubscriptions(
  account_id,
  participant_id,
  role,
  session_id,
  participant_is_new
) {
  // update the list of users, and role map
  addUserToList(participant_id, role);
  // console.log(`After push, userIdList is ${JSON.stringify(roleMap)}`);
  // console.log(`Also users is ${JSON.stringify(users)}`);

  // iterate through all users and update their subscriptions
  users.forEach(async function (user, p_id, u_map) {
    jsonSubs = determineSubscriptions(user, session_id);
    var body = new BandwidthWebRTC.Subscriptions(jsonSubs);

    if (DEBUG) {
      console.log(
        `updating user ${user.participant_id} to \n${JSON.stringify(jsonSubs)}`
      );
    }

    try {
      // first time we have to add, afterwards we update,
      //  so check if this iteration is for the user passed in
      if (participant_is_new && user.participant_id == participant_id) {
        await webRTCController.addParticipantToSession(
          account_id,
          session_id,
          user.participant_id,
          body
        );
      } else {
        await webRTCController.updateParticipantSubscriptions(
          account_id,
          user.participant_id,
          session_id,
          body
        );
      }
    } catch (error) {
      console.log("Error on add/UpdateParticipant to Session:", error);
      throw new Error(
        "Failed to updateSubscriptions, error from BAND:" + error.errorMessage
      );
    }
  });
}

/**
 * Update our users Map and role Map
 * @param {*} participant_id The participant we are adding to the call
 * @param {*} role the role of the participant we are adding to the call
 */
function addUserToList(participant_id, role) {
  // is this user new?
  if (!users.has(participant_id)) {
    console.log("setting up new user");
    roleMap[role].push(participant_id);

    users.set(participant_id, { role: role, participant_id: participant_id });
  } else {
    console.log("Updating an existing user (barge/whisper change)");
    // we need to update their role, if it has changed
    if (!roleMap[role].includes(participant_id)) {
      // clear it from any list
      validRoles.forEach(function (r) {
        // we don't know their old role (we could assume it's the opposite of current)
        var index = roleMap[r].indexOf(participant_id);
        if (index > -1) {
          roleMap[r].splice(index, 1);
        }
      });

      // and add them to the right list
      roleMap[role].push(participant_id);
    } else {
      // they didn't change.. odd
      console.log(
        `Not sure why we got a barge/whisper request without a role change` +
          `participant: ${participant_id}, role: ${role}`
      );
    }
  }
}

/**
 * Take a look at the users in the call to determine the subscription structure
 * @param user - a json object with: participant_id, role; from the global users list
 * @param session_id - we need this at the top level of the subscriptions
 * @return a json object with their list of subscriptions
 */
function determineSubscriptions(user, session_id) {
  if (DEBUG) {
    console.log(`subs for ${JSON.stringify(user)}`);
  }
  var subscriptions = [];
  // managers and employees can hear everyone
  if (user.role == "manager" || user.role == "employee") {
    subscriptions = subscriptions.concat(
      roleMap["manager"],
      roleMap["employee"],
      roleMap["guest"]
    );

    // guests can hear each other and employees
  } else if (user.role == "guest") {
    subscriptions = subscriptions.concat(roleMap["employee"], roleMap["guest"]);
  } else {
    console.log(`Bad role found: ${user.role}`);
  }

  // Remove this user from their own list of subs
  const index = subscriptions.indexOf(user.participant_id);
  if (index > -1) {
    subscriptions.splice(index, 1);
  }

  // setup the updated subscribe for this user
  var jsonBody = { sessionId: session_id, participants: [] };
  subscriptions.forEach(function (p_id) {
    jsonBody["participants"].push({ participantId: p_id });
  });

  return jsonBody;
}

/**
 * Start a call out to the PSTN
 * @param account_id The id for this account
 * @param from_number the FROM on the call
 * @param to_number the number to call
 */
async function initiateCallToPSTN(account_id, from_number, to_number) {
  // call body, see here for more details: https://dev.bandwidth.com/voice/methods/calls/postCalls.html
  var body = new BandwidthVoice.ApiCreateCallRequest({
    from: from_number,
    to: to_number,
    applicationId: process.env.VOICE_APPLICATION_ID,
    answerUrl: process.env.BASE_CALLBACK_URL + "callAnswered",
    answerMethod: "POST",
    callTimeout: "30",
  });

  return await voiceController.createCall(accountId, body);
}

/**
 * End the PSTN call
 * @param account_id The id for this account
 * @param call_id The id of the call
 */
async function endCallToPSTN(account_id, call_id) {
  // call body, see here for more details: https://dev.bandwidth.com/voice/methods/calls/postCallsCallId.html
  var body = new BandwidthVoice.ApiModifyCallRequest({ state: "completed" });
  try {
    await voiceController.modifyCall(accountId, call_id, body);
  } catch (error) {
    console.log("Failed to hangup the call", error);
    throw error;
  }
}

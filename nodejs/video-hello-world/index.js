const BandwidthWebRTC = require("@bandwidth/webrtc");
const express = require("express");
const dotenv = require("dotenv").config();

const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// global vars
const port = 3000;
const accountId = process.env.ACCOUNT_ID;

BandwidthWebRTC.Configuration.basicAuthUserName = process.env.USERNAME;
BandwidthWebRTC.Configuration.basicAuthPassword = process.env.PASSWORD;
var webRTCController = BandwidthWebRTC.APIController;

// track the session Ids
var sessions = new Map();

app.get("/joinCall", async (req, res) => {
  try {
    let sessionName = req.query.room_id;
    let sessionId;

    // create the session or get it from the global map
    if (sessions.has(sessionName)) {
      sessionId = sessions.get(sessionName);
    } else {
      let sessionBody = new BandwidthWebRTC.Session({ tag: `demo` });
      let sessionResponse = await webRTCController.createSession(
        accountId,
        sessionBody
      );
      sessionId = sessionResponse.id;
      sessions.set(sessionName, sessionId);
    }

    // setup the session and add this user into it
    var participantBody = new BandwidthWebRTC.Participant({
      publishPermissions: ["AUDIO", "VIDEO"],
    });

    var participantResponse = await webRTCController.createParticipant(
      accountId,
      participantBody
    );

    // return [createResponse.participant, participantResponse.token];

    var subscribeBody = new BandwidthWebRTC.Subscriptions({
      sessionId: sessionId,
    });

    console.log(
      `params: s:${sessionId}, p:${participantResponse.participant.id}`
    );
    await webRTCController.addParticipantToSession(
      accountId,
      sessionId,
      participantResponse.participant.id,
      subscribeBody
    );
  } catch (error) {
    console.log(`failed to setup participant: ${error.message}`);
    console.log(error);
    return res.status(500).send({ message: "failed to join session" });
  }

  // now that we have added them to the session,
  //  we can send back the token they need to join
  //  as well as info about the room they are in
  res.send({
    message: "created particpant and setup session",
    token: participantResponse.token,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

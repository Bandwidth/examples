import path from "path";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import jwt_decode from "jwt-decode";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 5000;
const accountId = <string>process.env.ACCOUNT_ID;
const username = <string>process.env.USERNAME;
const password = <string>process.env.PASSWORD;
const voiceApplicationPhoneNumber = <string>process.env.VOICE_APPLICATION_PHONE_NUMBER;
const voiceApplicationId = <string>process.env.VOICE_APPLICATION_ID;
const voiceCallbackUrl = <string>process.env.VOICE_CALLBACK_URL;
const outboundPhoneNumber = <string>process.env.OUTBOUND_PHONE_NUMBER;

const callControlUrl = `${process.env.BANDWIDTH_WEBRTC_CALL_CONTROL_URL}/accounts/${accountId}`;
const sipxNumber = <string>process.env.BANDWIDTH_WEBRTC_SIPX_PHONE_NUMBER;

// Check to make sure required environment variables are set
if (!accountId || !username || !password) {
  console.error(
    "ERROR! Please set the ACCOUNT_ID, USERNAME, and PASSWORD environment variables before running this app"
  );
  process.exit(1);
}

interface Participant {
  id: string;
  token: string;
}

let sessionId: string;
let browserParticipant: Participant | null;
let phoneParticipant: Participant | null;
let activeCallId: string | null;

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// REST API Config                                                         //
//                                                                         //
// These endpoints handle requests from the browser to get connection      //
// info and requests from the Voice API to handle incoming phone calls     //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////

/**
 * The browser will hit this endpoint to get a session and participant ID
 */
app.get("/connectionInfo", async (req, res) => {
  if (browserParticipant) {
    deleteParticipant(browserParticipant.id);
  }
  browserParticipant = await createParticipant("hello-world-browser");
  res.send({
    token: browserParticipant.token,
    voiceApplicationPhoneNumber: voiceApplicationPhoneNumber,
    outboundPhoneNumber: outboundPhoneNumber,
  });
});

/**
 * The browser will hit this endpoint to initiate a call to the outbound phone number
 */
app.get("/callPhone", async (req, res) => {
  if (!outboundPhoneNumber) {
    const error = "no outbound phone number has been set";
    console.log(error);
    res.status(400).send(error);
  }

  if (activeCallId) {
    const error = `call ${activeCallId} is already in progress`;
    console.log(error);
    res.status(400).send(error);
  }

  phoneParticipant = await createParticipant("hello-world-phone");
  await callPhone(outboundPhoneNumber);
  res.status(204).send();
});

/**
 * The browser will hit this endpoint to play audio to the connected phone
 * 
 * This will effectively remove the phone from the WebRTC session so it can receive the audio file
 */
app.get("/playAudioToPhone", async (req, res) => {
  if (!activeCallId) {
    const error = "no active call";
    console.log(error);
    res.status(400).send(error);
    return;
  }

  try {
    let response = await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${accountId}/calls/${activeCallId}`,
      {
        redirectUrl: `${voiceCallbackUrl}/playAudio`,
      },
      {
        auth: {
          username: username,
          password: password,
        },
      }
    );
    res.status(204).send();
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * The browser will hit this endpoint to hangup
 * 
 * This will terminate the call and delete the phone participant while leaving the browser participant active and connected to the session
 */
app.get("/endCall", async (req, res) => {
  if (activeCallId) {
    endCall(activeCallId);
  }
  res.status(204).send();
});

/**
 * Bandwidth's Voice API will hit this endpoint when we receive an incoming call
 */
app.post("/incomingCall", async (req, res) => {
  const callId = req.body.callId;
  console.log(`received incoming call ${callId} from ${req.body.from}`);
  if (activeCallId) {
    console.log(`already have active call ${activeCallId}, ignoring incoming call`);
    const bxml = `<?xml version="1.0" encoding="UTF-8" ?>
    <Response>
      <Hangup/>
    </Response>`;
    res.contentType("application/xml").send(bxml);
    return;
  }

  activeCallId = callId;
  phoneParticipant = await createParticipant("hello-world-phone");

  // This is the response payload that we will send back to the Voice API to transfer the call into the WebRTC session
  const bxml = await generateTransferBxml(phoneParticipant.token);

  // Send the payload back to the Voice API
  res.contentType("application/xml").send(bxml);
  console.log(`transferring call ${callId} to session ${sessionId} as participant ${phoneParticipant.id}`);
});

/**
 * Bandwidth's Voice API will hit this endpoint when an outgoing call is answered
 */
app.post("/callAnswered", async (req, res) => {
  const callId = req.body.callId;
  console.log(`received answered callback for call ${callId} tp ${req.body.to}`);

  if (callId !== activeCallId) {
    console.log(`callId ${callId} does not match activeCallId ${activeCallId}`);
    const bxml = `<?xml version="1.0" encoding="UTF-8" ?>
    <Response>
      <Hangup/>
    </Response>`;
    res.contentType("application/xml").send(bxml);
    return;
  }

  if (!phoneParticipant) {
    console.log(`no participant found for ${callId}!`);
    res.status(400).send();
    return;
  }

  // This is the response payload that we will send back to the Voice API to transfer the call into the WebRTC session
  const bxml = await generateTransferBxml(phoneParticipant.token);

  // Send the payload back to the Voice API
  res.contentType("application/xml").send(bxml);
  console.log(`transferring call ${callId} to session ${sessionId} as participant ${phoneParticipant.id}`);
});

/**
 * Bandwidth's Voice API will hit this endpoint to play audio
 */
app.post("/playAudio", async (req, res) => {
  console.log("playing audio file to phone");
  const bxml = `<?xml version="1.0" encoding="UTF-8" ?>
  <Response>
    <PlayAudio>voicemail.wav</PlayAudio>
  </Response>`;
  res.contentType("application/xml").send(bxml);
});

/**
 * Bandwidth's Voice API will hit this endpoint with status updates for calls
 */
app.post("/callStatus", async (req, res) => {
  res.status(200).send();
  if (req.body.eventType === "disconnect") {
    // Do some cleanup
    const callId = req.body.callId;
    console.log(`received disconnect event for call ${callId}`);
    if (callId === activeCallId) {
      activeCallId = null;
      if (phoneParticipant) {
        deleteParticipant(phoneParticipant.id);
        phoneParticipant = null;
      } else {
        console.log("no participant associated with event", req.body);
      }
    } else {
      console.log(`callId ${callId} does not match activeCallId ${activeCallId}`);
    }
  } else {
    console.log("received unexpected status update", req.body);
  }
});

// These two lines set up static file serving for the React frontend
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});
app.listen(port, () => console.log(`WebRTC Hello World listening on port ${port}!`));

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// Bandwidth WebRTC Functions                                              //
//                                                                         //
// The following few functions make requests to the WebRTC Service to      //
// create sessions and participants.                                       //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////

/**
 * Get a new or existing WebRTC session ID
 */
const getSessionId = async (): Promise<string> => {
  // If we already have a valid session going, just re-use that one
  if (sessionId) {
    try {
      await axios.get(`${callControlUrl}/sessions/${sessionId}`, {
        auth: {
          username: username,
          password: password,
        },
      });
      console.log(`using session ${sessionId}`);
      return sessionId;
    } catch (e) {
      console.log(`session ${sessionId} is invalid, creating a new session`);
    }
  }

  // Otherwise start a new one and return the ID
  let response = await axios.post(
    `${callControlUrl}/sessions`,
    {
      tag: "hello-world",
    },
    {
      auth: {
        username: username,
        password: password,
      },
    }
  );
  sessionId = response.data.id;
  console.log(`created new session ${sessionId}`);
  return sessionId;
};

/**
 * Create a new participant and save their ID to our app's state map
 */
const createParticipant = async (tag: string): Promise<Participant> => {
  // Create a new participant
  let createParticipantResponse = await axios.post(
    `${callControlUrl}/participants`,
    {
      callbackUrl: "https://example.com",
      publishPermissions: ["AUDIO"],
      tag: tag,
    },
    {
      auth: {
        username: username,
        password: password,
      },
    }
  );

  const participant = createParticipantResponse.data.participant;
  const token = createParticipantResponse.data.token;
  const participantId = participant.id;
  console.log(`created new participant ${participantId}`);

  // Add participant to session
  const sessionId = await getSessionId();
  await axios.put(
    `${callControlUrl}/sessions/${sessionId}/participants/${participant.id}`,
    {
      sessionId: sessionId,
    },
    {
      auth: {
        username: username,
        password: password,
      },
    }
  );

  return {
    id: participantId,
    token: token,
  };
};

/**
 * Delete a participant
 */
const deleteParticipant = async (participantId: string) => {
  console.log(`deleting participant ${participantId}`);
  return axios.delete(
    `${callControlUrl}/participants/${participantId}`,
    {
      auth: {
        username: username,
        password: password,
      },
    }
  );
}

/**
 * Ask Bandwidth's Voice API to call the outbound phone number
 */
const callPhone = async (phoneNumber: string) => {
  try {
    let response = await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${accountId}/calls`,
      {
        from: voiceApplicationPhoneNumber,
        to: phoneNumber,
        answerUrl: `${voiceCallbackUrl}/callAnswered`,
        disconnectUrl: `${voiceCallbackUrl}/callStatus`,
        applicationId: voiceApplicationId,
        callTimeout: 60,
      },
      {
        auth: {
          username: username,
          password: password,
        },
      }
    );

    activeCallId = response.data.callId;
    console.log(`initiated call ${activeCallId} to ${outboundPhoneNumber}...`);
  } catch (e) {
    console.log(`error calling ${outboundPhoneNumber}: ${e}`);
  }
};

const endCall = async (callId: string) => {
  try {
    console.log(`ending call ${callId}`);
    let response = await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${accountId}/calls/${callId}`,
      {
        state: "completed",
      },
      {
        auth: {
          username: username,
          password: password,
        },
      }
    );
    console.log(`ended call ${callId}`);
  } catch (e) {
    console.log(`error ending call: ${e}`);
  }
}

/**
 * Helper method to generate transfer BXML from a WebRTC device token
 * @param deviceToken device token received from the call control API for a participant
 */
const generateTransferBxml = async (deviceToken: string) => {
  //Get the tid out of the participant jwt
  var decoded: any = jwt_decode(deviceToken);

  return `<?xml version="1.0" encoding="UTF-8" ?>
    <Response>
      <Transfer transferCallerId="${decoded.tid}"><PhoneNumber>${sipxNumber}</PhoneNumber></Transfer>
    </Response>`;
};

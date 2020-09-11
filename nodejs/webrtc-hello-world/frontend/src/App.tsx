import React, { useState, useEffect } from "react";
import "./App.css";
import { Fab, Box } from "@material-ui/core";
import {
  Call,
  CallEnd,
  PlayArrow,
} from "@material-ui/icons";
import { red, green } from "@material-ui/core/colors";

import BandwidthRtc, { RtcStream } from "@bandwidth/webrtc-browser";


const bandwidthRtc = new BandwidthRtc();

const App: React.FC = () => {
  // We will use these state variables to hold our device token and application phone number
  const [token, setToken] = useState<string>();
  const [voiceApplicationPhoneNumber, setVoiceApplicationPhoneNumber] = useState<string>();
  const [outboundPhoneNumber, setOutboundPhoneNumber] = useState<string>();

  // This state variable holds the remote stream object - the audio from the phone
  const [remoteStream, setRemoteStream] = useState<RtcStream>();

  // This effect connects to our server backend to get a device token
  // It will only run the first time this component renders
  useEffect(() => {
    fetch("/connectionInfo").then(async (response) => {
      const responseBody = await response.json();
      setToken(responseBody.token);
      setVoiceApplicationPhoneNumber(responseBody.voiceApplicationPhoneNumber);
      setOutboundPhoneNumber(responseBody.outboundPhoneNumber);
    });
  }, []);

  // This effect will fire when the token changes
  // It will connect a websocket to Bandwidth WebRTC, and start streaming the browser's mic
  useEffect(() => {
    if (token) {
      // Connect to Bandwidth WebRTC
      bandwidthRtc
        .connect({
          deviceToken: token,
        })
        .then(async () => {
          console.log("connected to bandwidth webrtc!");
          // Publish the browser's microphone
          await bandwidthRtc.publish({
            audio: true,
            video: false,
          });
          console.log("browser mic is streaming");
        });
    }
  }, [token]);

  // This effect sets up event SDK event handlers for remote streams
  useEffect(() => {
    // This event will fire any time a new stream is sent to us
    bandwidthRtc.onStreamAvailable((rtcStream: RtcStream) => {
      console.log("receiving audio!");
      setRemoteStream(rtcStream);
    });

    // This event will fire any time a stream is no longer being sent to us
    bandwidthRtc.onStreamUnavailable((endpointId: string) => {
      console.log("no longer receiving audio");
      setRemoteStream(undefined);
    });
  });

  // Initiate a call to the outbound phone number listed
  const callOutboundPhoneNumber = () => {
    console.log(`calling ${outboundPhoneNumber}`);
    fetch("/callPhone").then(async (response) => {
      if (response.ok) {
        console.log("Ringing...");
      } else {
        const json = await response.json();
        console.log("Something went wrong", json);
      }
    })
  }

  // Play audio to the connected phone
  // This will effectively remove them from this session
  const playAudioToPhone = () => {
    console.log("playing audio to phone");
    fetch("/playAudioToPhone").then(async (response) => {
      if (response.ok) {
        console.log("Playing audio to phone...");
      } else {
        const json = await response.json();
        console.log("Something went wrong", json);
      }
    })
  }

  // End the call with the phone, leaving the browser connected
  const endCall = () => {
    console.log("ending call");
    fetch("/endCall").then(async (response) => {
      if (response.ok) {
        console.log("ended call");
      } else {
        const json = await response.json();
        console.log("Something went wrong", json);
      }
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>WebRTC Hello World</div>
        {remoteStream ? (
          <div>
            <video
              playsInline
              autoPlay
              style={{ display: "none" }}
              ref={(videoElement) => {
                if (videoElement && remoteStream && videoElement.srcObject !== remoteStream.mediaStream) {
                  // Set the video element's source object to the WebRTC MediaStream
                  videoElement.srcObject = remoteStream.mediaStream;
                }
              }}
            ></video>
            Hooray! You're connected!
            <div>
              <Fab
                style={{color: "white", backgroundColor: red["A700"], marginLeft: "10px"}}
                onClick={endCall}
              >
                <CallEnd />
              </Fab>
            </div>
            <br/>
            <div>Examples:</div>
            <div>
              Play audio file to phone (voicemail drop)
              <Fab
                style={{color: "white", backgroundColor: green["A700"], marginLeft: "10px"}}
                onClick={playAudioToPhone}
              >
                <PlayArrow />
              </Fab>
            </div>
          </div>
        ) : (
          <div>
            <div>Dial {voiceApplicationPhoneNumber || "your Voice API phone number"} to chat with this browser</div>
            {outboundPhoneNumber &&
              <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                <span>or click to call {outboundPhoneNumber}</span>
                <Fab
                  style={{color: "white", backgroundColor: green["A700"], marginLeft: "10px"}}
                  onClick={callOutboundPhoneNumber}
                >
                  <Call />
                </Fab>
              </div>
            }
          </div>
        )}
      </header>
    </div>
  );
};

export default App;

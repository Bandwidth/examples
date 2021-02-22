// establish what media we are looking to get access to
const constraints = (window.constraints = {
  audio: false, // prevents feedback, this is only for "self" display
  video: true,
});

// an audio file used for the ringing sound
const audio = new Audio("ringing.mp3");
audio.loop = true;

/**
 * Setup our listeners for the events from the media server
 */
window.addEventListener("load", (event) => {
  // when we get the stream
  bandwidthRtc.onStreamAvailable((rtcStream) => {
    audio.pause();
    console.log("receiving audio/video streams!");
    console.log(rtcStream);
    // console.log(rtcStream);
    // tracks = rtcStream.mediaStream.getAudioTracks();
    document.getElementById("friendVideo").srcObject = rtcStream.mediaStream;
  });
  // when we lose the stream
  bandwidthRtc.onStreamUnavailable((endpointId) => {
    remoteVideoComponent = document.getElementById("friendVideo");
    console.log("no longer receiving audio/video streams");
    remoteVideoComponent.srcObject = undefined;

    // Non-webrtc specific, just showing what's going on
    if (!document.getElementById("endButton").disabled) {
      alert("Call ended, stream is unavailable");
    }

    // this will remove the friend icon if it was set
    unsetFriend();

    setActive();
    disableButton("endButton");
    enableButton("callButton");
  });
});

/**
 * Get the token required to auth with the media server
 */
async function getToken() {
  // this is set in the setFriend function (misc.js) to "friend" or "main"
  forWhom = document.getElementById("endButton").dataset.relationship;
  // prevent double clicks
  disableButton("onlineButton");
  console.log("Fetching token from server for " + forWhom);
  if (forWhom == "main") {
    url = "/startBrowserCall";
  } else {
    url = "/friend";
  }
  const res = await fetch(url);
  // basic error handling
  if (res.status !== 200) {
    console.log(res);
    alert("Failed to set you up as a participant: " + res.status);
  } else {
    const json = await res.json();
    console.log(json);
    startStreaming(json.token);
  }
}

/**
 * Now that we have the token, we can start streaming media
 * The token param is fetched from the server above
 */
async function startStreaming(token) {
  console.log("connecting to BAND WebRTC server");
  // Connect to Bandwidth WebRTC

  await bandwidthRtc.connect({ deviceToken: token });
  console.log("connected to bandwidth webrtc!");
  // Publish the browser's microphone
  await bandwidthRtc.publish({
    audio: true,
    video: true,
  });
  console.log("browser mic is streaming");
  // update ui status & enable the next step
  setActive();
  enableButton("callButton");
}

/**
 * Reach out to our Server app to start the PSTN call
 */
async function callPSTN() {
  // prevent double clicks
  disableButton("callButton");
  setFriendAsCall();
  const url = "/startPSTNCall";

  console.log("About to make a call");
  let res = await fetch(url);
  console.log(res);
  if (res.status !== 200) {
    console.log(res);
    alert("Failed to create PSTN participant: " + res.status);
  } else {
    audio.play();
    setInCall();
    enableButton("endButton");
  }
}

async function endCall() {
  const url = "/endPSTNCall";
  console.log("About to make a call");
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(json);
    // enable the next step
    setActive();
    disableButton("endButton");
    enableButton("callButton");
  } catch (error) {
    console.error("Error in callPSTN:", error);
  }
}

/**
 * Get the media from the camera and mic
 */
async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById("myVideo").srcObject = stream;
  } catch (e) {
    onError(e);
  }
}

function onError(error) {
  if (error.name === "ConstraintNotSatisfiedError") {
    const v = constraints.video;
    showError(
      `The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`
    );
  } else if (error.name === "PermissionDeniedError") {
    showError(
      "Permissions have not been granted to use your camera and " +
        "microphone, you need to allow the page access to your devices in " +
        "order for the demo to work."
    );
  }
  showError(`getUserMedia error: ${error.name}`);
  console.log(error);
}

window.onload = (event) => {
  setFriend();
  init();
};

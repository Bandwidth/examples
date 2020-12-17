const bandwidthRtc = new BandwidthRtc();
// your participant_id
var participant_id = "unset";
// your media stream
var my_audio_stream;

/**
 * Setup our listeners for the events from the media server
 */
window.addEventListener("load", (event) => {
  console.log("loading listeners");
  bandwidthRtc.onStreamAvailable((rtcStream) => {
    console.log("receiving audio!");
    console.log(rtcStream);

    // get the sound flowing
    var sound = document.createElement("audio");
    sound.id = rtcStream.endpointId;
    sound.autoplay = true;
    document.getElementById("media_div").appendChild(sound);
    sound.srcObject = rtcStream.mediaStream;

    // create a block for the stream
    var newStream = document.createElement("div");
    newStream.id = "div_" + rtcStream.endpointId;
    newStream.style.display = "inline-block";
    newStream.width = 380;
    newStream.height = 50;
    newStream.margin = 5;
    newStream.style.color = "red";
    newStream.innerText = "Endpoint " + rtcStream.endpointId;
    newStream.appendChild(document.createElement("br"));

    // create a canvas for audio visual
    var stream_canvas = document.createElement("canvas");
    stream_canvas.id = "canvas_" + rtcStream.endpointId;
    stream_canvas.width = 350;
    stream_canvas.height = 20;
    stream_canvas.style = "border: 1px solid gray";
    newStream.appendChild(stream_canvas);

    document.getElementById("gui_div").appendChild(newStream);

    // get the canvas showing some audio
    attach(stream_canvas, rtcStream.mediaStream);
  });

  bandwidthRtc.onStreamUnavailable((endpointId) => {
    console.log("no longer receiving audio for endpoint: " + endpointId);
    audioElement = document.getElementById(endpointId);
    if (audioElement !== null) {
      audioElement.srcObject = undefined;
      document.getElementById("canvas_" + endpointId).style.display = "none";
      streamEl = document.getElementById("div_" + endpointId);
      var dead = document.createElement("span");
      dead.innerText = "stream gone ";
      streamEl.appendChild(dead);
    } else {
      console.log(
        "We got a disconnect on " + endpointId + " but never got media"
      );
      // create a block for the stream
      var newStream = document.createElement("div");
      newStream.id = "div_" + rtcStream.endpointId;
      newStream.style.display = "inline-block";
      newStream.width = 380;
      newStream.height = 50;
      newStream.margin = 5;
      newStream.style.color = "red";
      newStream.innerText =
        "Disconnect only on Endpoint " + rtcStream.endpointId;
      document.getElementById("gui_div").appendChild(newStream);
    }

    setActive();
    disableButton("endButton");
    enableButton("callButton");
  });
});

/**
 * Get the token required to auth with the media server
 */
async function getToken() {
  // prevent double clicks
  disableButton("onlineButton");
  console.log("Fetching token from server");

  try {
    var res = await fetch(
      "/startBrowserCall?role=" + document.getElementById("role").value,
      {
        method: "POST",
      }
    );
  } catch (error) {
    console.log(`failed to setup browser on fetch ${error}`);
    return;
  }
  // basic error handling
  if (res.status !== 200) {
    console.log(res);
    alert("Failed to set you up as a participant: " + res.status);
  } else {
    const json = await res.json();
    console.log(json);
    // set some data to make debugging and understanding
    sessionEl = document.getElementById("session_id");
    sessionEl.innerText = json.session_id;

    participant_id = json.participant_id;
    partEl = document.getElementById("participant_id");
    partEl.innerText = participant_id;

    // set the barge link
    if (document.getElementById("role").value == "manager") {
      manageBargeLink("barge");
    }
    startStreaming(json.token);
    // add a mute button
    enableMuteButton();
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
  streamResp = await bandwidthRtc.publish({
    audio: true,
    video: false,
  });
  my_audio_stream = streamResp.mediaStream;
  console.log("browser mic is streaming with stream:");
  console.log(my_audio_stream);
  // update ui status & enable the next step
  setActive();
  disableButton("onlineButton");
  enableButton("callButton");
}

/**
 * Effectively change a manager to an employee (and back again)
 *  - also update the link to revert state
 */
async function setBargeState(state) {
  console.log(`about to go to '${state}' for ${participant_id}`);
  try {
    var res = fetch("/barge?participant=" + participant_id + "&state=" + state);
    if (state == "barge") {
      newState = "whisper";
    } else {
      newState = "barge";
    }
    console.log(`updating action link to '${newState}'`);
    manageBargeLink(newState);
  } catch (error) {
    console.log(`failed to barge you ${error}`);
    return;
  }
}

/**
 * Add a link for managers to barge, or revert back
 */
function manageBargeLink(state) {
  console.log("setting room action: " + state);
  if (state == "barge") {
    removeId = "whisper";
    text = "Barge In";
    linkId = "barge";
  } else {
    // go whisper
    removeId = "barge";
    text = "Back to Whispering";
    linkId = "whisper";
  }

  // remove old link if it's there
  oldLink = document.getElementById(removeId);
  if (oldLink) {
    oldLink.remove();
  }

  actionDiv = document.getElementById("room_actions");
  link = document.createElement("a");
  linkText = document.createTextNode(text);
  link.appendChild(linkText);
  link.href = "#";
  link.setAttribute("onclick", 'setBargeState("' + linkId + '")');
  link.id = linkId;
  actionDiv.appendChild(link);
}

var micState = false;
/**
 * Locally mute/unmute your media
 */
function muteFlip() {
  micState = !micState;
  my_audio_stream.getAudioTracks()[0].enabled = micState;
  muteLink = document.getElementById("mute_link");
  document.getElementById("mute_icon").remove();
  mute = document.createElement("i");
  if (micState) {
    mute.id = "mute_icon";
    mute.classList.add("fas");
    mute.classList.add("fa-microphone");
  } else {
    mute.id = "mute_icon";
    mute.classList.add("fas");
    mute.classList.add("fa-microphone-alt-slash");
  }
  muteLink.appendChild(mute);
}
function enableMuteButton() {
  micState = true;
  button = document.getElementById("mute_link");
  button.setAttribute("onclick", "muteFlip()");
  button.style.display = "block";
}

/**
 * Reach out to our Server app to start the PSTN call
 */
async function callPSTN() {
  // prevent double clicks
  disableButton("callButton");
  console.log("About to make a call");

  let pstnRes = await fetch("/startPSTNCall");

  if (pstnRes.status !== 200) {
    console.log(json);
    alert("Failed to set you up as a participant: " + pstnRes.status);
  } else {
    const pstnJson = await pstnRes.json();
    console.log(pstnJson);

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

//
// Functions to make the UI easy, not WebRTC at all
//
// Online indicator
function setInCall() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Online - IN Call";
  statusDiv.style.color = "green";
}
function setActive() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Online - no Call";
  statusDiv.style.color = "green";
}
function setInactive() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Offline";
  statusDiv.style.color = "red";
}

// buttons
function enableButton(buttonId) {
  document.getElementById(buttonId).style.display = "block";
}
function disableButton(buttonId) {
  document.getElementById(buttonId).style.display = "none";
}

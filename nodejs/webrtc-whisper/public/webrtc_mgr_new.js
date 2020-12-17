const bandwidthRtc = new BandwidthRtc();
//
// configuration
const DEBUG = true;
const statusDiv = null;
// a div to append log messages to on screen
const logDiv = false;
// a div to append new media elements to (video or audio)
//  not needed if you implement onNewStream
const mediaDiv = false;
const videoEnabled = true;
// ring while waiting for first connection
const enableRinging = false;
// when media connects, mute your mic by default
const start_muted_audio = false;

//
//  internal global vars, don't set these
// universal id for the call (the server tells us this)
let internal_call_id = "";
let other_callers = [];

// global vars
var my_media_stream;

/**
 * Get the token required to auth with the media server
 */
async function getToken() {
  // prevent double clicks
  // disableButton("onlineButton");
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
      setBargeState("barge");
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
  // enableButton("callButton");
}

/**
 * Just get this user offline, don't end the session for everyone
 */
async function signOff() {
  bandwidthRtc.disconnect();
  // remove the others from this screen
  other_callers.forEach(function (caller) {
    disconnectEndpoint(caller);
  });
}

/**
 * End the current session for all callers
 * uses internal_call_id to know what to end, set when you got online
 */
async function endSession() {
  updateStatus("Ending Call");
  console.log(`Ending session: ${internal_call_id}`);

  // hangup the webrtc connection
  bandwidthRtc.disconnect();

  // clear out any remaining connections
  other_callers.forEach(function (caller) {
    removeCaller(caller);
  });

  try {
    var res = await fetch("/endSession?identifier=" + internal_call_id);

    // basic error handling
    if (res.status !== 200) {
      console.log(res);
      alert("Failed to end your session: " + res.status);
      return;
    } else {
      updateStatus("Call Ended");
    }
  } catch (error) {
    console.log(`failed to end the session ${error}`);
    console.log("we'll keep cleaning up though");
  }
}

/**
 * Place a call to BAND to start on the PSTN, leverages serverside function
 * @param {string} number a +1 NANP number
 * @param identifier - something to identify this room/call
 */
async function placePSTNCall(number, identifier) {
  // then start the call
  updateStatus("dialing");
  var res = await fetch(
    "/startPSTNCall?to_num=" + number + "&identifier=" + identifier
  );
  const json = await res.json();
  return json;
  //   console.log(json);
}

/**
 * Setup our listeners for the events from the media server
 */
window.addEventListener("load", (event) => {
  bandwidthRtc.onStreamAvailable((rtcStream) => {
    connectStream(rtcStream);
  });

  bandwidthRtc.onStreamUnavailable((endpointId) => {
    disconnectEndpoint(endpointId);
  });
});

function connectStream(rtcStream) {
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
}
function disconnectEndpoint(endpointId) {
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
    newStream.innerText = "Disconnect only on Endpoint " + rtcStream.endpointId;
    document.getElementById("gui_div").appendChild(newStream);
  }

  setActive();
  // disableButton("endButton");
  // enableButton("callButton");
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

//
// List and select devices
async function listCameras(selectId) {
  return getDeviceList("videoinput");
}
async function listMicrophones(selectId) {
  return getDeviceList("audioinput");
}

async function getDeviceList(type) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  let deviceList = [];

  devices.forEach(function (device) {
    if (device.kind == type) {
      deviceList.push({ label: device.label, deviceId: device.deviceId });
    }
  });

  return deviceList;
}

//
// Manipulate the media streams
/**
 * Mutes the mic, note that this mutes all mic inputs
 */
var is_mic_enabled = true;
function muteFlip() {
  is_mic_enabled = !is_mic_enabled;
  if (is_mic_enabled) {
    set_mute_all("audio", false);
  } else {
    set_mute_all("audio", true);
  }
}
function mute() {
  // if already muted
  if (is_mic_enabled) {
    is_mic_enabled = false;
    set_mute_all("audio", true);
  }
}
function unmute() {
  // if already unmuted
  if (!is_mic_enabled) {
    is_mic_enabled = true;
    set_mute_all("audio", false);
  }
}
function enableMuteButton() {
  micState = true;
  button = document.getElementById("mute_link");
  button.setAttribute("onclick", "muteFlip()");
  button.style.display = "block";
}
/**
 * 'Mutes' all cameras
 */
var is_cam_enabled = true;
function video_muteFlip() {
  is_cam_enabled = !is_cam_enabled;
  if (is_cam_enabled) {
    set_mute_all("video", false);
  } else {
    set_mute_all("video", true);
  }
}
function video_mute() {
  // if already muted
  if (is_cam_enabled) {
    is_cam_enabled = false;
    set_mute_all("video", true);
  }
}
function video_unmute() {
  if (!is_cam_enabled) {
    is_cam_enabled = true;
    set_mute_all("video", false);
  }
}

/**
 * Set the mute state for all video or audio tracks
 * @param {string} type 'audio' or 'video'
 * @param {boolean} mute_state true for mute, false for unmute
 */
function set_mute_all(type, mute_state) {
  my_media_stream.getTracks().forEach(function (stream) {
    // console.log("looping");
    // console.log(stream);
    if (stream.kind == type) {
      stream.enabled = !mute_state;
    }
  });
}

//
// PlayAudio File in Browser
//
const pre_sound = "play_sound_id_";
function playAudio(name, url) {
  var sound_el = document.createElement("audio");
  // sound.id = ;
  sound_el.autoplay = true;
  sound_el.id = pre_sound + name;
  sound_el.loop = true;
  sound_el.src = url;
  if (mediaDiv) {
    document.getElementById(mediaDiv).appendChild(sound_el);
  } else {
    document.body.appendChild(sosound_elund);
  }
}
function stopAudio(name) {
  sound_el = document.getElementById(pre_sound + name);
  if (sound_el) {
    // make sure the sound stops right away
    sound_el.muted = true;
    sound_el.remove();
  }
}

//
// LOGGING / STATUS UPDATES
//
function setStatusDiv(status_div_id) {
  if (!statusDiv) {
    statusDiv = status_div_id;
  }
}
/**
 * set a the innerHTML of a div to the status,
 *  expects statusDiv to be set
 * @param {*} status
 */
function updateStatus(status) {
  if (!statusDiv) {
    console.log(
      `WARNING: statusDiv was never set (via setStatusDiv()), would have set ${status}`
    );
  } else {
    document.getElementById(statusDiv).innerHTML = status;
  }
}

//
// This gets the debug info into a div on the screen
// helpful for debugging mobile clients
if (DEBUG) {
  if (typeof console != "undefined") {
    if (typeof console.log != "undefined") {
      console.orig_log = console.log;
    } else console.orig_log = function () {};
  }

  console.log = function (message) {
    console.orig_log(message);
    if (logDiv) {
      document.getElementById(logDiv).append(">" + message);
      document.getElementById(logDiv).append(document.createElement("br"));
    }
  };
  console.error = console.debug = console.info = console.log;
}

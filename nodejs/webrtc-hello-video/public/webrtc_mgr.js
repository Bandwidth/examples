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
var camSelector = false;
var micSelector = false;

// universal id for the call (the server tells us this)
let internal_call_id = "";
let other_callers = [];

// global vars
var my_media_stream;
var my_screen_stream;

/**
 * Get the token required to auth with the media server
 * Use that token to start streaming
 * @param call_info json object with the following
 *  caller: {name: "adam"}
 *  call_type: phone", or "push"
 *  room: room_name
 *  audio: true OR false (usually true)
 *  video: true OR false
 */
async function getOnline(call_info) {
  // prevent double clicks
  console.log("Fetching token from server for: ");
  console.log(call_info);

  updateStatus("Call Setup");
  try {
    // call your server function that does call control
    var res = await fetch("/startCall", {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(call_info), // body data type must match "Content-Type" header
    });
  } catch (error) {
    console.log(`getOnline> error on fetch ${error}`);
    return;
  }
  // basic error handling
  if (res.status !== 200) {
    console.log(res);
    alert("getOnline> got back non-200: " + res.status);
  } else {
    const json = await res.json();
    console.log(json);
    internal_call_id = json.room.name;
    // ring
    if (enableRinging) {
      playAudio("ring", "/ring.mp3");
    }

    startStreaming(json.token, call_info);
  }
}

/**
 * Now that we have the token, we can start streaming media
 * The token param is fetched from the server above
 */
async function startStreaming(token, call_info) {
  console.log("connecting to BAND WebRTC server");
  // Connect to Bandwidth WebRTC

  await bandwidthRtc.connect({ deviceToken: token });
  console.log("connected to bandwidth webrtc!");
  // Publish the browser's microphone and video if appropriate

  // set the video constraints
  var video_constraints = false;
  if (call_info.video) {
    video_constraints = {
      aspectRatio: 1.333,
      frameRate: 30,
      width: { min: 320, max: 640 },
      height: { min: 240, max: 480 },
      resizeMode: "crop-and-scale",
    };

    if (camSelector) {
      cam_device = document.getElementById(camSelector).value;
      if (cam_device != "default") {
        video_constraints.deviceId = { exact: cam_device };
      }
    }
  }

  // set the audio constraints
  var audio_constraints = false;
  if (call_info.audio) {
    audio_constraints = {
      echoCancellation: true,
    };
    if (micSelector) {
      mic_device = document.getElementById(micSelector).value;
      if (mic_device != "default") {
        audio_constraints.deviceId = { exact: mic_device };
      }
    }
  }

  streamResp = await bandwidthRtc.publish({
    audio: audio_constraints,
    video: video_constraints,
  });
  my_media_stream = streamResp.mediaStream;
  if (start_muted_audio) {
    mute();
  }
  updateStatus("Online...");
  console.log(
    `browser mic is streaming with stream id: ${streamResp.mediaStream.id}`
  );
}

/**
 * Start screensharing in an already online/publishing state
 */
async function startScreenShare() {
  video_constraints = {
    frameRate: 30,
  };
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: video_constraints,
  });

  streamResp = await bandwidthRtc.publish(screenStream);
  my_screen_stream = streamResp.mediaStream;
}

/**
 * Just get this user offline, don't end the session for everyone
 */
async function signOff() {
  bandwidthRtc.disconnect();
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
    clearCaller(caller);
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
 * Place a call to BAND to start on the PSTN
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
  // check if this is already connected
  if (other_callers.indexOf(rtcStream.endpointId) > -1) {
    console.log(`duplicate receipt of:${rtcStream.endpointId}`);
    return;
  }
  console.log(`receiving media! ${rtcStream.endpointId}`);
  console.log(rtcStream);

  // get the sound flowing
  var elType = "audio";
  if (videoEnabled) {
    elType = "video";
  }
  var mediaEl = document.createElement(elType);
  mediaEl.id = rtcStream.endpointId;
  mediaEl.autoplay = true;
  mediaEl.srcObject = rtcStream.mediaStream;

  // keep track of the streams we're connected to
  other_callers.push(rtcStream.endpointId);

  // clean up any ringing audio
  stopAudio("ring");
  // update status
  updateStatus("In Call");

  // either append it to mediaDiv, or give it back to the calling script/file
  if (typeof onNewStream === "function") {
    console.log("calling customer onNewStream function");
    onNewStream(mediaEl, rtcStream);
  } else {
    console.log("no onNewStream functin defined");
    if (mediaDiv) {
      document.getElementById(mediaDiv).appendChild(mediaEl);
    } else {
      document.body.appendChild(mediaEl);
    }
  }
}
function disconnectEndpoint(endpointId) {
  console.log("no longer receiving media for endpoint: " + endpointId);
  if (other_callers.indexOf(endpointId) > -1) {
    clearCaller(endpointId);

    // if there is no one left in the call
    if (other_callers.length == 0) {
      updateStatus("Call Ended");
      console.log("All callers are off the line, ending call");
      // alert("The call is over");
      // optional function to call when there are no other participants left
      if (typeof allCallsEnded != "undefined") {
        allCallsEnded();
      }
    }

    if (typeof onEndStream === "function") {
      console.log("calling customer onNewStream function");
      onEndStream(endpointId);
    }
  } else {
    console.log(
      "We got a disconnect on " +
        endpointId +
        " but have no media for, this is common as a second notice of an ended stream"
    );
  }
}
/**
 * Clear out the div for this caller
 * @param {*} id
 */
function clearCaller(id) {
  let index = other_callers.indexOf(id);
  if (index > -1) {
    other_callers.splice(index, 1);
    audioElement = document.getElementById(id);
    audioElement.srcObject = undefined;
    audioElement.remove();
  }
}
//
// List and select devices
async function listCameras(selectId) {
  camSelector = selectId;
  listDevices(selectId, "videoinput");
}
async function listMicrophones(selectId) {
  micSelector = selectId;
  listDevices(selectId, "audioinput");
}
async function listDevices(selectId, type) {
  let selector = document.getElementById(selectId);
  const devices = await navigator.mediaDevices.enumerateDevices();

  devices.forEach(function (device) {
    if (device.kind == type) {
      var opt = document.createElement("option");
      opt.value = device.deviceId;
      opt.text = device.label;
      selector.add(opt);
    }
  });

  // if we added items to this list, then remove the DEFAULT message
  if (selector.length > 1) {
    selector.remove(0);
  }
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
 * Mutes the mic, note that this assumes one mic stream
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
  if (!is_mic_enabled) {
    return;
  }
  is_mic_enabled = false;
  set_mute_all("audio", true);
}
function unmute() {
  // if already unmuted
  if (is_mic_enabled) {
    return;
  }
  is_mic_enabled = true;
  set_mute_all("audio", false);
}
/**
 * 'Mutes' the camera
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
  if (!is_cam_enabled) {
    return;
  }
  is_cam_enabled = false;
  set_mute_all("video", true);
}
function video_unmute() {
  // if already unmuted
  if (is_cam_enabled) {
    return;
  }
  is_cam_enabled = true;
  set_mute_all("video", false);
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
  var sound = document.createElement("audio");
  // sound.id = ;
  sound.autoplay = true;
  sound.id = pre_sound + name;
  sound.loop = true;
  sound.src = url;
  if (mediaDiv) {
    document.getElementById(mediaDiv).appendChild(sound);
  } else {
    document.body.appendChild(sound);
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

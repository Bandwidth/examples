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
var my_screen_stream;
var local_video_stream = false;

/**
 * Get the token required to auth with the media server
 * Use that token to start streaming
 * @param call_info json object with the following
 *  caller: {name: "callers name"}
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
    var res = await fetch("/joinCall", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(call_info),
    });
  } catch (error) {
    console.log(`getOnline> error on fetch ${error}`);
    return;
  }
  // basic error handling
  if (res.status !== 200) {
    alert("getOnline> got back non-200: " + res.status);
    console.log(res);
  } else {
    const json = await res.json();
    console.log(json);

    // save this for later use to sign off gracefully
    internal_call_id = json.room.name;

    // ring if desired, ring until someone joins
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
  // Connect to Bandwidth WebRTC
  await bandwidthRtc.connect({ deviceToken: token });
  console.log("connected to bandwidth webrtc!");
  //
  // Publish the browser's microphone and video if appropriate
  // set the video constraints
  var video_constraints = false;
  if (call_info.video) {
    video_constraints = {
      frameRate: 30,
      width: { min: 320, max: 640 },
      height: { min: 240, max: 480 },
      resizeMode: "crop-and-scale",
    };

    if (call_info.video_device == "none") {
      video_constraints = false;
    } else if (call_info.video_device != "default") {
      video_constraints.deviceId = { exact: call_info.video_device };
    } // if it is default, we'll let getUserMedia decide
  }

  // set the audio constraints
  var audio_constraints = false;
  if (call_info.audio) {
    audio_constraints = {
      echoCancellation: true,
    };
    if (call_info.mic_device == "none") {
      audio_constraints = false;
    } else if (call_info.mic_device != "default") {
      audio_constraints.deviceId = { exact: call_info.mic_device };
    } // if it is default, we'll let getUserMedia decide
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
 * Start or stop screensharing in an already online/publishing state
 */
async function screenShare() {
  // if we're already sharing, then stop
  if (my_screen_stream) {
    // unpublish
    await bandwidthRtc.unpublish(my_screen_stream.endpointId);

    // stop the tracks locally
    var tracks = my_screen_stream.getTracks();
    tracks.forEach(function (track) {
      console.log(`stopping stream`);
      console.log(track);
      track.stop();
    });

    my_screen_stream = null;
  } else {
    // we're not sharing, so start
    video_constraints = {
      frameRate: 30,
    };
    // getDisplayMedia is the magic function for screen/window/tab sharing
    my_screen_stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: video_constraints,
    });

    // start the share and save the endPointId so we can unpublish later
    var resp = await bandwidthRtc.publish(my_screen_stream);
    my_screen_stream.endpointId = resp.endpointId;
  }
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
    var res = await fetch("/endSession?room_name=" + internal_call_id);

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

  // if this endpoint is still active on the call
  if (other_callers.indexOf(endpointId) > -1) {
    removeCaller(endpointId);

    // if there is no one left in the call
    if (other_callers.length == 0) {
      updateStatus("Call Ended");
      console.log(`All callers are off the line, ending call`);
      bandwidthRtc.disconnect();
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
      `We got a disconnect on ${endpointId} but have no media for, this is common as a second notice of an ended stream`
    );
  }
}
/**
 * remove the div for this caller
 * @param {*} id
 */
function removeCaller(id) {
  let index = other_callers.indexOf(id);
  if (index > -1) {
    other_callers.splice(index, 1);
    audioElement = document.getElementById(id);
    audioElement.srcObject = undefined;
    audioElement.remove();
  }
}

/**
 * Show a "vanity" view of your camera as it will be displayed to
 *  other participants
 * @param {string} cam_device the device id for the device to stream from (list available via listCameras)
 * @param {string} video_id the dom element id that we should make this video a child of
 * @param {json} video_constraints Any additional video constraints you'd like to add to this video
 */
async function show_vanity_mirror(
  cam_device,
  video_id,
  video_constraints = {}
) {
  // disable any current device, this is important to turn off the cam (and it's led light)
  disable_vanity_mirror();

  // allows for an option like "disable" in the cam selector
  if (cam_device == "none") {
    video_constraints = false;
    document.getElementById(video_id).srcObject = null;
    return;
  } else {
    video_constraints.deviceId = { exact: cam_device };
  }

  try {
    local_video_stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: video_constraints,
    });
    document.getElementById(video_id).srcObject = local_video_stream;
  } catch (error) {
    console.log(`Failed to acquire local video: ${error.message}`);
    alert("Sorry, we can't proceed without access to your camera");
  }
}

/**
 * Stop the camera and showing it in the corner
 */
function disable_vanity_mirror() {
  if (local_video_stream) {
    var tracks = local_video_stream.getTracks();
    tracks.forEach(function (track) {
      console.log("stopping track");
      track.stop();
    });
  }
}

//
// manage inputs
async function getCameras() {
  return await bandwidthRtc.getVideoInputs();
}
async function getMics() {
  return await bandwidthRtc.getAudioInputs();
}

//
// Manipulate the media streams
/**
 * Mutes the mic, note that this assumes one mic stream
 */
function mute() {
  set_mute_all("audio", true);
}
function unmute() {
  set_mute_all("audio", false);
}
/**
 * 'Mutes' the camera
 */
function video_mute() {
  set_mute_all("video", true);
}
function video_unmute() {
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

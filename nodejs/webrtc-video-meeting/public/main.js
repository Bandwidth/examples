var room_name = false;

// the select elements for devices
var cam_selector = "cam_selector";
var mic_selector = "mic_selector";

window.onload = async function () {
  signOnButton = document.getElementById("signOn");
  signOnButton.onclick = async function () {
    if (room_name == "") {
      room_name = prompt("What room would you like to join?", "lobby");
      if (!room_name) {
        room_name = "lobby";
      }
    }
    console.log("Initialize app");
    document.getElementById("sign_on_controls").style.display = "none";
    document.getElementById("in_call_controls").style.display = "block";

    let call_info = {
      caller: { name: "adam" },
      call_type: "app",
      room: room_name,
      audio: true,
      video: true,
      video_device: document.getElementById(cam_selector).value,
      mic_device: document.getElementById(mic_selector).value,
    };
    await getOnline(call_info);
  };

  document.getElementById("sign_out").onclick = async function () {
    await signOff();
    document.getElementById("sign_on_controls").style.display = "block";
    document.getElementById("in_call_controls").style.display = "none";
  };

  document.getElementById(cam_selector).onchange = async function () {
    await show_vanity_mirror(this.value, "my_video");
  };

  screenShareButton = document.getElementById("screen_share");
  screenShareButton.onclick = async function () {
    await screenShare();
  };

  // enumerate cameras
  cams = await getCameras();
  updateDeviceSelector(cam_selector, cams);
  mics = await getMics();
  updateDeviceSelector(mic_selector, mics);

  // not everything is ready right at load, so wait a bit, then show default video
  setTimeout(function () {
    show_vanity_mirror(document.getElementById(cam_selector).value, "my_video");
  }, 500);

  // check for a room_name on the query string
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("room")) {
    room_name = urlParams.get("room");
  }
};

/**
 * Update our device lists, which current have a "default" option
 */
function updateDeviceSelector(selector_id, devices) {
  let selector = document.getElementById(selector_id);

  devices.forEach(function (device) {
    let opt = document.createElement("option");
    opt.value = device.deviceId;
    opt.text = device.label;
    selector.add(opt);
  });

  // if we had items in this list
  if (devices.length > 0) {
    // then remove the DEFAULT message
    selector.remove(0);

    // and add in a "no camera" option
    //  we'll look for a "none" option when going online
    var opt = document.createElement("option");
    opt.value = "none";
    opt.text = "disable";
    selector.add(opt);
  }
}

/**
 * This is fired off when a new person joins the room
 * Custom function that you implement based on your UI and behavioral needs
 *
 * @param mediaEl the prebuilt media element, to add to our dom
 * @param rtcStream the actual stream
 */
function onNewStream(mediaEl, rtcStream) {
  // create a block for the stream
  var newStream = document.createElement("div");
  newStream.id = "tile_" + rtcStream.endpointId;
  newStream.style.display = "inline-block";
  newStream.classList.add("tile");

  mediaEl.height = 200;
  newStream.appendChild(mediaEl);

  document.getElementById("filmstrip").appendChild(newStream);
}

/**
 * Clean up all the DOM elements for the participant that left
 * Custom function that you implement based on your UI and behavioral needs
 *
 * @param endPointId the id of endpoint that left
 */
function onEndStream(endPointId) {
  tile = document.getElementById("tile_" + endPointId);
  if (tile) tile.remove();
}

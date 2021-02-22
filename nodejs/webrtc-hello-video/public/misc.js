// This library has several functions that manage elements on the page
// - none of these are relevant to the WebRTC aspects of the page

function showError(message) {
  errorDiv = document.querySelector("#error");
  errorDiv.innerHTML += "<p>" + message + "</p>";
}

//
// These functions just manage the buttons and status

// status
function setInCall() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Online - IN Call";
  statusDiv.style.color = "green";
}
function setActive() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Online";
  statusDiv.style.color = "green";
}
function setInactive() {
  var statusDiv = document.getElementById("call_status");
  statusDiv.innerHTML = "Offline";
  statusDiv.style.color = "red";
}

// buttons
function enableButton(buttonId) {
  document.getElementById(buttonId).disabled = false;
}
function disableButton(buttonId) {
  document.getElementById(buttonId).disabled = true;
}

/**
 * If this is the friend browser then setup the screen accordingly
 */
function setFriend() {
  const urlParams = new URLSearchParams(window.location.search);
  const isFriend = urlParams.get("friend");
  if (isFriend == "true") {
    document.getElementById("endButton").dataset.relationship = "friend";
    document.getElementById("endButton").style.display = "none";
    document.getElementById("callButton").style.display = "none";
    document.getElementById("main_title").innerHTML = "Friend Handler";
  } else {
    document.getElementById("endButton").dataset.relationship = "main";
  }
}

/**
 * Make things pretty visually for phone calls
 */
function setFriendAsCall() {
  var picture = document.createElement("img");
  picture.setAttribute("width", "125");
  picture.id = "friend_pic";
  document.getElementById("friendDisplay").appendChild(picture);
  picture.src = "phone_pic.png";
}

function unsetFriend() {
  pic = document.getElementById("friend_pic");
  if (pic) {
    pic.remove();
  }
}

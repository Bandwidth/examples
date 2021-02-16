# Video Hello World

This sample app shows how to use our Video API to create a basic multi-person, multi-'room' video application using NodeJS and minimalist browser-side Javascript.

## Architecture Overview

This app runs an HTTP server that listens for requests from browsers to get connection information. This connection information tells a browser the unique ID it should use to join a Room.

The server connects to Bandwidth's HTTP WebRTC API, which it will use to create a session and participant IDs. This example leverages our Node SDK to make the WebRTC calls.

The web browser will also use a websocket managed by the WebRTC browser SDK to handle signaling to the WebRTC API - this is all handled by a prepackaged Javascript SDK. Once more than one browser has joined the conference, they will be able to talk to each other.

> Note: Unless you are running on `localhost`, you will need to use HTTPS. Most modern browsers require a secure context when accessing cameras and microphones.

## Setting things up

To run this sample, you'll need WebRTC Video enabled for your account (accounts may be provisioned for Audio only). Please check with your account manager to ensure you are provisioned for Video.

### Configure your sample app

Copy the default configuration files

```bash
cp .env.default .env
```

Add your Bandwidth account settings to `.env`:

```
vi .env
```

- BAND_ACCOUNT_ID
- BAND_USERNAME
- BAND_PASSWORD

### Install dependencies and build

```bash
npm install
node server.js
```

Or you can use [Nodemon](https://www.npmjs.com/package/nodemon) for live updating when you change a js file!

### Communicate!

Browse to [http://localhost:3000](http://localhost:3000) and grant permission to use your microphone and camera.

- Select your device from the list, which is autodetected on page load
- Click _Click to Start_ to get a token for your browser, get you connected to our media server, and start media flowing from the browser
- Enter a room name (if it wasn't set in the query string)
- Do the same in another browser, with the same room name of course
- Start two other browsers with a different room name

You should now be able to enjoy 2 separate video calls!

### Options and Notes

- You can preset a name for the room by putting the query param `room` in the query string of the url - try [http://localhost:3000?room=test%20room](http://localhost:3000?room=test%20room)
- You can autostart all the attendees muted by changing the `start_muted_audio` variable to `true` at the top of `public/webrtc_mgr.js`
  - Note that an unmute button isn't provided in this example though
  - However there are javascript functions in `public/webrtc_mgr.js` for muting and unmuting both audio and video

# Video Hello World

This sample app shows how to use our Video API to create a basic multi-person, multi-'room' video application using NodeJS and minimalist browser-side Javascript.

## Architecture Overview

<img src="./WebRTC Hello World.svg">

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

- ACCOUNT_ID
- USERNAME
- PASSWORD

You can ignore any other settings in the `.env.default` file.

### Install dependencies and build

```bash
npm install
node server.js
```

### Communicate!

Browse to [http://localhost:3000](http://localhost:3000) and grant permission to use your microphone.

- clicking _Click to Start_ will get a token for your browser, get you connected to our media server, and start media flowing from the browser
- select a room name
- Do the same in another browser, with the same room name

You should now be able to enjoy your video call!

<div align="center">

# Bandwidth Node Bridging Example

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice Bridging functionality

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `npm install` to get started

## Usage

The following environmental variables need to be set

| Variable                   | Description                                         |
|:---------------------------|:----------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`     | Your Bandwidth Messaging account ID                 |                               
| `BANDWIDTH_API_USERNAME`       | Your Bandwidth Voice API username                   |
| `BANDWIDTH_API_PASSWORD`       | Your Bandwidth Voice API password                   |
| `BANDWIDTH_VOICE_APPLICATION_ID`     | Your Bandwidth Voice application ID                 |
| `BASE_URL`                 | The base url of the server running this application |

## Callback URLs For Bandwidth Applications

| Callback Type          | URL                   |
|:-----------------------|:----------------------|
| Inbound Voice Callback | <url>/VoiceCallback   |

## Run The Server
Run the following command to start the server

```
npm start
```

You are now ready to text your Bandwidth phone number that is associated with the application

## What You Can Do

* 

---

# Tutorial
## Assumptions

* Have Bandwidth Account
* Have NodeJS Installed (along with NPM)
* Have [ngrok](https://ngrok.com) installed

## NPM

```bash
npm init
npm i @bandwidth/bxml
npm i @bandwidth/messaging
npm i @bandwidth/voice
npm i express
npm i dotenv

touch index.js
touch messaging.js
touch voice.js
touch config.js
touch .env
```

## Code-along


# BandwidthReferenceApp

![BW_all](../../.readme_images/BW_all.png)

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `npm install` to get started

## Usage

The following environmental variables need to be set

| Variable                 | Description                                         |
|:-------------------------|:----------------------------------------------------|
| MESSAGING_ACCOUNT_ID     | Your Bandwidth Messaging account ID                 |
| MESSAGING_API_TOKEN      | Your Bandwidth Messaging API token                  |
| MESSAGING_API_SECRET     | Your Bandwidth Messaging API secret                 |
| MESSAGING_APPLICATION_ID | Your Bandwidth Messaging application ID             |
| VOICE_ACCOUNT_ID         | Your Bandwidth Voice account ID                     |
| VOICE_API_USERNAME       | Your Bandwidth Voice API username                   |
| VOICE_API_PASSWORD       | Your Bandwidth Voice API password                   |
| VOICE_APPLICATION_ID     | Your Bandwidth Voice application ID                 |
| BASE_URL                 | The base url of the server running this application |

## Callback URLs For Bandwidth Applications

| Callback Type          | URL                   |
|:-----------------------|:----------------------|
| Messaging Callback     | <url>/MessageCallback |
| Inbound Voice Callback | <url>/VoiceCallback   |

## Run The Server
Run the following command to start the server

```
npm start
```

You are now ready to text your Bandwidth phone number that is associated with the application

## What You Can Do

* Text your phone number any phrase other than `call me` and you will receive a response with the current date-time
* Text your phone number `call me` and you will receive a phone call asking you to transfer the call via a 10 digit dtmf gather
* Text your phone number an image and you will receive the same image sent through Bandwidth's media API
* Call your phone number and you will be asked to play a game

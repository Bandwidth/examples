<div align="center">

# BandwidthReferenceApp

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `composer require bandwidth/sdk` to get started

## Usage

The following environmental variables need to be set

| Variable | Description |
|--|--|
| MESSAGING_ACCOUNT_ID | Your Bandwidth Messaging account ID |
| MESSAGING_API_TOKEN | Your Bandwidth Messaging API token |
| MESSAGING_API_SECRET | Your Bandwidth Messaging API secret |
| MESSAGING_APPLICATION_ID | Your Bandwidth Messaging application ID |
| VOICE_ACCOUNT_ID | Your Bandwidth Voice account ID |
| VOICE_API_USERNAME | Your Bandwidth Voice API username |
| VOICE_API_PASSWORD | Your Bandwidth Voice API password |
| VOICE_APPLICATION_ID | Your Bandwidth Voice application ID |
| BASE_URL | The base url of the server running this application |

## Callback URLs For Bandwidth Applications

| Callback Type | URL |
|--|--|
| Messaging Callback | <url>/messaging/callback.php |
| Inbound Voice Callback | <url>/voice/callback.php |

## Run The Server
Run the following command to start the server

```
php -S localhost:5000
```

You can replace `5000` with any other valid port you want to use

You are now ready to text your Bandwidth phone number that is associated with the application

# BandwidthReferenceApp

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up a Bandwidth Messaging Application and have a phone number associated with this application, and point the callback URL on this application to the messaging endpoing on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `pip install -r requirements.txt` to get started

## Usage

The following environmental variables need to be set

| Variable | Description |
|--|--|
| ACCOUNT_ID | Your Bandwidth account ID |
| API_TOKEN | Your Bandwidth Messaging API token |
| API_SECRET | Your Bandwidth Messaging API secret |
| MESSAGING_APPLICATION_ID | Your Bandwidth Messaging Account ID |

After setting the environmental variables, start the server by running the following command

```
python server.py
```

You are now ready to text your Bandwidth phone number that is associated with the application

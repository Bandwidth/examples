# BandwidthReferenceApp

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

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
python app.py
```

You are now ready to text your Bandwidth phone number that is associated with the application

<div align="center">

# Bandwidth Python Bridging Example

![Python](../../.readme_images/BW_Voice.png)

A small sample app that covers basic use cases with Bandwidth's Voice Bridging functionality

</div>

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Assumptions

* Have Bandwidth Account
* Have Python Installed (along with pip)
* Have [ngrok](https://ngrok.com) installed
* Access to 3 phone numbers - a number to make the outgoing call from, a Bandwidth number to call into, and a number the call will be forwarded to

## Installation



## Usage

The following environmental variables need to be set

| Variable                         | Description                                         |
|:---------------------------------|:----------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`           | Your Bandwidth account ID                           |
| `BANDWIDTH_API_USER`             | Your Bandwidth Voice API username                   |
| `BANDWIDTH_API_PASSWORD`         | Your Bandwidth Voice API password                   |
| `BANDWIDTH_VOICE_APPLICATION_ID` | Your Bandwidth Voice application ID                 |
| `PERSONAL_NUMBER`                | The Number the inbound call is forwarded to         |
| `BASE_URL`                       | Base URL of your server - Ngrok in this example     |
| `PORT`                           | The port to run the flask app on                    |

## Callback URLs For Bandwidth Applications

| Callback Type             | URL                   |
|:--------------------------|:----------------------|
| Inbound Voice Callback    | <url>/VoiceCallback   |
| Outbound Answer Callback  | <url>/Outbound/Answer |
| Outbound Gather Callback  | <url>/Outbound/Gather |
| Disconnect                | <url>/Disconnect      |
| Update Call               | <url>/UpdateCall      |
| Recording Available       | <url>/Recording       | 


## Run The Server
Run the following command to start the server

```
./ngrok http 5000
```

And in a separate terminal window

```
python app.py
```

You are now ready to call the Bandwidth phone number that is associated with the application

## What You Can Do

* Receive an Inbound call from a 3rd party
* Imitate a hold while you create an outbound call
* Allow the callee to accept or decline the incoming call
* Bridge the calls if accepted
* If declined, record a voicemail from the incoming caller

---

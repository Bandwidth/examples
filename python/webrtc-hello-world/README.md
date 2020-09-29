<div align="center">

# Bandwidth Python WebRTC HelloWorld App

![BW_all](../../.readme_images/BW_all.png)

</div>

This sample app shows a very simple way to get a phone to talk to a browser through Bandwidth's WebRTC and Voice APIs, with Python and minimalist browser-side Javascript.

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Description

A small example demonstrating basic Bandwidth operations with the Python SDK

## Running The App

### Environmental Variables

The following configuration variables need to be set, start by coping the `config.ini.default` file to `config.ini`. For more information about each variable. Read more about each variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable               | Description                                                       | Example                                |
| :--------------------- | :---------------------------------------------------------------- | :------------------------------------- |
| `account_id`           | Your Bandwidth Account Id                                         | `539525`                               |
| `api_user`             | Your Bandwidth API Username                                       | `johnDoe`                              |
| `api_password`         | Your Bandwidth API Password                                       | `hunter22`                             |
| `voice_application_id` | Your Bandwidth Voice application ID                               | `acd1575d-b0f7-4274-95ee-e942a286df8c` |
| `base_callback_url`    | The url for your dev server, with ending /                        | `https://e8b0c1c2a03e.ngrok.io/`       |
| `from_number`          | The "From" caller Id number for your call                         | `+13428675309`                         |
| `dail_number`          | the number to dial out to when you click "Dial Out" in the Web UI | `+14835552343`                         |

### Commands

Run the following commands to get started

```
pip install -r requirements.txt

cp config.ini.default config.ini
# edit config.ini per the description above

ngrok http 5000
# update your config.ini to have the ngrok url that is shown on screen
# you'll need to do this every time you restart ngrok if you want callbacks to work
```

```
# leave that open, in a new terminal...
python app.py
```

## What You Can Do

- go to http://localhost:3000 and you will see a basic call interface
- Click "Get Online" to connect your browser to the media server
- Click on "Dial Out" to initiate the PSTN call from the server side and add the PSTN call to the session, this will also transfer the call to the WebRTC session once it has been answered.
- Click "End Call" to remove the participant from the session and end the PSTN call

# Tutorial

## Assumptions

- Have Bandwidth Account
- Have Python (3.7.6+) Installed (along with pip)
- Have [ngrok](https://ngrok.com) installed

## Read through the Code

The code for this example is fairly well documented, so please take a look through it to understand how it works. But here are a few pointers on flow

### General Flow

The path that you take to add people into a WebRTC call is as follows:

1. Create a session
1. Create a participant
1. Add the participant to a session
1. Create another participant
1. Add that participant to session

In the case of this app, because one of the participants is on the PSTN we have a couple more steps to add on to this. This now becomes:

6. Start the PSTN call
1. Await callback indicating that the call was answered
1. Transfer the call to SIP URI when the call is answered

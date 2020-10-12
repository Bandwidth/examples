<div align="center">

# Bandwidth Python 2FA HelloWorld App

![BW_all](../../.readme_images/BW_all.png)

</div>

This sample app shows a very simple example of a website and admin page that are secured by 2FA

## Pre-Reqs

You will need to set up Bandwidth Applications and have at least one phone number associated with the messaging application. Messages need to be sent with a FROM number that is associated with a Location that is associated with your messaging application.

## Description

A small example demonstrating basic Bandwidth 2FA operations with the Python SDK

## Running The App

### Environmental Variables

The following configuration variables need to be set, start by copying the `config.ini.default` file to `config.ini`. For more information about each variable. Read more about each variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable                   | Description                                  | Example                                |
| :------------------------- | :------------------------------------------- | :------------------------------------- |
| `account_id`               | Your Bandwidth Account Id                    | `539525`                               |
| `api_user`                 | Your Bandwidth API Username                  | `johnDoe`                              |
| `api_password`             | Your Bandwidth API Password                  | `hunter22`                             |
| `voice_application_id`     | Your Bandwidth Voice application ID          | `acd1575d-b0f7-4274-95ee-e942a286df8c` |
| `messaging_application_id` | Your Bandwidth messaging application ID      | `acd1121d-c093-4274-95ee-98372838338`  |
| `from_number`              | The "From" number for your call or message   | `+13428675309`                         |
| `user_number`              | the number for the user, which receives 2FAs | `+14835552343`                         |

### Commands

Run the following commands to get started

```
pip install -r requirements.txt

cp config.ini.default config.ini
# edit config.ini per the description above, be sure to enter the recipient phone for the `user_number`
```

```
# leave that open, in a new terminal... this should launch a server on http://localhost:5000
python app.py
```

## What You Can Do

- Go to http://localhost:5000 and you will see user login
- Enter a username, anything will do; Note that it will be referenced in the message sent with the 2FA Code
- Select your preference for delivery of the Code, either voice or sms (this will persist for this session)
- Click login, then you'll be presented with a page where you enter the 2FA code; this is the "login" scope
- Enter the code you receive on your phone
- You can click the link to the "secure area", which is another area that is protected by a different scope
- again you enter a 2FA code that will be sent to your phone. This will be delivered via the same as your already selected preference. To change this you will need to log out.

# Tutorial

## Assumptions

- Have Bandwidth Account
- Have Python (3.7.6+) Installed (along with pip)

## Read through the Code

The code for this example is fairly well documented, so please take a look through it to understand how it works. But here are a few pointers on flow

### General Flow

The path that you take to add people into a WebRTC call is as follows:

1. Determine user's phone number
1. request a 2FA be sent to them via voice (`create_voice_two_factor`) or sms (`create_messaging_two_factor`) the body required is detailed in the app
1. Request that the user provide the code back to you
1. Verify the code via the `create_verify_two_factor` call, it returns True or False in `response.body.valid`

This application makes use of 2 Scopes, one for Login and one for Admin. This allows for the separation of these 2FAs, a Code for one cannot be used for the other.

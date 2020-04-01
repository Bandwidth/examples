# Bandwidth Template

⚠️ This project uses an old SDK and will be updated soon

## Description
A template to be used to build Bandwidth C# apps

## Running The App

### Environmental Variables
The following environmental variables need to be set

| Variable | Description |
|--|--|
| MSG_ACCOUNT_ID | Your Bandwidth Messaging account ID |
| MSG_API_USERNAME | Your Bandwidth Messaging API token |
| MSG_API_PASSWORD | Your Bandwidth Messaging API secret |
| MSG_APPLICATION_ID | Your Bandwidth Messaging application ID |
| VOICE_ACCOUNT_ID | Your Bandwidth Voice account ID |
| VOICE_API_USERNAME | Your Bandwidth Voice API username |
| VOICE_API_PASSWORD | Your Bandwidth Voice API password |
| VOICE_APPLICATION_ID | Your Bandwidth Voice application ID |
| SERVER_PUBLIC_URL | The public url for the server |

### Callback URLs For Bandwidth Applications

| Callback Type | URL |
|--|--|
| Messaging Callback | <url>/Callbacks/Messaging |
| Inbound Voice Callback | <url>/Callbacks/Voice/Inbound |

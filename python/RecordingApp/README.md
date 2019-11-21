<div align="center">

# Voicemail Service

<a href="http://dev.bandwidth.com"><img src="https://s3.amazonaws.com/bwdemos/BW_Voice.png"/></a>
</div>

## Description
A sample app that mimics a voicemail service using Bandwidth's Voice API and Recording

## How It Works
When someone calls the number, they are given a prompt to leave a voicemail. After a timeout of 3 minutes or `#` is pressed, the recording ends. The user has the option of hearing the recording, and re-recording if necessary.

Once the recording is done, the user will receive an MMS with the recording.

## Running The App

### Environmental Variables
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

### Commands
Run the following commands to get started

```
pip install -r requirements.txt
python app.py -p <port>
```

where `port` is the port to run the app on. Unassigned, `port` will default to `5000`.

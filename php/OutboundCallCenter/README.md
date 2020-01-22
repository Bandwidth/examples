# OutboundCallCenter

A sample app to show how to create an outbound call with a desired caller ID

## Pre-Reqs

You will need to set up a Bandwidth Application and associate a phone number to it, and have it point to `<your_url>/transfer.php` for the Voice Callback. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `composer require bandwidth/sdk` to get started

## Usage

The following environmental variables need to be set

| Variable | Description |
|--|--|
| VOICE_ACCOUNT_ID | Your Bandwidth Voice account ID |
| VOICE_API_USERNAME | Your Bandwidth Voice API username |
| VOICE_API_PASSWORD | Your Bandwidth Voice API password |
| VOICE_APPLICATION_ID | Your Bandwidth Voice application ID |
| BASE_URL | The base url of the server running this application |
| BW_PHONE_NUMBER | The Bandwidth phone number to create the initial outbound call |

After setting the environmental variables, start the server by running the following command

```
php -S localhost:5000
```

You can replace `5000` with any other valid port you want to use

### Trigger An Event

Make an HTTP POST request with the following JSON to `<your_url>/outbound.php`. Replace the `XXXYYYZZZZ` values with your desired phone numbers

```
{
  "studentPhoneNumber": "+1XXXYYYZZZZ",
  "desiredCallerId": "+XXXYYYZZZZ",
  "agentPhoneNumber" : "+XXXYYYZZZZ"
}
```

The `agentPhoneNumber` will be called by your `BW_PHONE_NUMBER`. Once answered, a `Transfer` event will start that will transfer the call to the `studentPhoneNumber` with the caller ID as the `desiredCallerId`

<div align="center">

# Bandwidth Python Webinar App

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Description
A small example demonstrating basic Bandwidth operations with the Ruby SDK

## Running The App

### Environmental Variables
The following environmental variables need to be set. For more information about each variable. Read more about each variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable                              | Description                             | Example                                            |
|:--------------------------------------|:----------------------------------------|:---------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`                | Your Bandwidth Account Id               | `239525`                                           |
| `BANDWIDTH_API_USER`                  | Your Bandwidth API Username             | `johnDoe`                                          |
| `BANDWIDTH_API_PASSWORD`              | Your Bandwidth API Password             | `correct-horse-battery-stap1e`                     |
| `BANDWIDTH_MESSAGING_TOKEN`           | Your Bandwidth Messaging API token      | `eabb9d360e4025c81e28d336612ff402861a68d8f578307e` |
| `BANDWIDTH_MESSAGING_SECRET`          | Your Bandwidth Messaging API secret     | `70ba9d5e4f6c9739f86eab6e117f148af1ef8093793cbc87` |
| `BANDWIDTH_MESSAGING_APPLICATION_ID ` | Your Bandwidth Messaging application ID | `725e2ee2-a8c9-4a41-896a-9adad68456a8`             |
| `BANDWIDTH_VOICE_APPLICATION_ID`      | Your Bandwidth Voice application ID     | `acd1575d-b0f7-4274-95ee-e942a286df8c`             |


### Callback URLs For Bandwidth Applications

| Callback Type          | URL                        |
|:-----------------------|:---------------------------|
| Messaging Callback     | `/Callbacks/Messaging`     |
| Inbound Voice Callback | `/Callbacks/Voice/Inbound` |

### Commands
Run the following commands to get started

```
pip install -r requirements.txt
python app.py
```

## What You Can Do

* Text your phone number `dog` and you will receive a picture of a dog sent back
* Text your phone number any phrase other than `dog` and you will receive a response with the current date-time
* Call your phone number and you will be asked to play a game


# Tutorial

## Assumptions

* Have Bandwidth Account
* Have Python (3.7.6+) Installed (along with pip)
* Have [ngrok](https://ngrok.com) installed

## Code-along

### Intialize Bandwidth client

* Check environment variables and define client

```python
try:
    BANDWIDTH_ACCOUNT_ID = os.environ["BANDWIDTH_ACCOUNT_ID"]
    BANDWIDTH_API_USER = os.environ["BANDWIDTH_API_USER"]
    BANDWIDTH_API_PASSWORD = os.environ["BANDWIDTH_API_PASSWORD"]
    BANDWIDTH_MESSAGING_TOKEN = os.environ["BANDWIDTH_MESSAGING_TOKEN"]
    BANDWIDTH_MESSAGING_SECRET = os.environ["BANDWIDTH_MESSAGING_SECRET"]
    BANDWIDTH_MSG_APPLICATION_ID = os.environ["BANDWIDTH_MESSAGING_APPLICATION_ID"]
    BANDWIDTH_VOICE_APPLICATION_ID = os.environ["BANDWIDTH_VOICE_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=BANDWIDTH_API_USER,
    voice_basic_auth_password=BANDWIDTH_API_PASSWORD,
    messaging_basic_auth_user_name=BANDWIDTH_MESSAGING_TOKEN,
    messaging_basic_auth_password=BANDWIDTH_MESSAGING_SECRET
)
```

## Handling message callbacks

* For this guide, we're only actually hitting the Bandwidth API on inbound messages
* Parse out the callback using the APIHelper tools

```python
raw_data = APIHelper.json_deserialize(request.data).pop()
messaging_callback: BandwidthCallbackMessage = BandwidthCallbackMessage.from_dictionary(raw_data)
message: BandwidthMessage = messaging_callback.message
```

### Check if DLR

* Bandwidth's messaging API sends both inbound message events and outbound DLRs to the same URL
* We need to check the direction of the message to determine actions.
  * for outbound messages, print the status and move on

```python
is_dlr = message.direction.lower().strip() == 'out'
if is_dlr:
    log_message = 'Callback Received for: MessageId: %s, status: %s'
    print(log_message % (message.id, messaging_callback.description))
    return 'Received Callback'
```

### Build the 'to' array

* As we're responding to any inbound message, if it's a group message we should reply to the group

```python
owner = message.owner
to_numbers = message.to.copy()
to_numbers.remove(owner)
to_numbers.append(message.mfrom)
```

### Build the message request

* Most of the message request is similar regardless of the inbound text content.
* So let's go ahead and build the skeleton request and fill in later

```python
message_request = MessageRequest(application_id=BANDWIDTH_MSG_APPLICATION_ID,
                                 to=to_numbers,
                                 mfrom=owner)
```

### Check if dog

* If the inbound message is "dog" we're going to send a picture
* Otherwise, we're going to reply to the message

```python
message_text = message.text.lower().strip()
is_dog = message_text == 'dog'
if is_dog:
    message_request.text = '🐶'
    message_request.media =['https://bw-demo.s3.amazonaws.com/dog.jpg']
else:
    message_request.text = '👋 Hello From bandwidth!'
```

### Build the client and send the message

* Now that we have the message, let's send it and log the response

```python
messaging_client: APIController = bandwidth_client.messaging_client.client
api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
message_response: BandwidthMessage = api_response.body
log_message = 'Sent message with MessageId: %s'
print(log_message % message_response.id)
return "Handle messaging callback"
```

### All together the messaging handler looks like

```python
@app.route("/Callbacks/Messaging", methods=["POST"])
def handle_messaging_callback():
    # raw_data = json.loads(request.data).pop()
    raw_data = APIHelper.json_deserialize(request.data).pop()
    messaging_callback: BandwidthCallbackMessage = BandwidthCallbackMessage.from_dictionary(raw_data)
    message: BandwidthMessage = messaging_callback.message
    is_dlr = message.direction.lower().strip() == 'out'
    if is_dlr:
        log_message = 'Callback Received for: MessageId: %s, status: %s'
        print(log_message % (message.id, messaging_callback.description))
        return 'Received Callback'
    owner = message.owner
    to_numbers = message.to.copy()
    to_numbers.remove(owner)
    to_numbers.append(message.mfrom)
    message_request = MessageRequest(application_id=BANDWIDTH_MSG_APPLICATION_ID,
                                     to=to_numbers,
                                     mfrom=owner)
    message_text = message.text.lower().strip()
    is_dog = message_text == 'dog'
    if is_dog:
        message_request.text = '🐶'
        message_request.media =['https://bw-demo.s3.amazonaws.com/dog.jpg']
    else:
        message_request.text = '👋 Hello From bandwidth!'
    messaging_client: APIController = bandwidth_client.messaging_client.client
    api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
    message_response: BandwidthMessage = api_response.body
    log_message = 'Sent message with MessageId: %s'
    print(log_message % message_response.id)
    return "Handle messaging callback"
```

## Handling Voice callbacks

* We're always replying with the same BXML for each call
* Don't need to concern ourselves with details about the callback event
* The [Gather](https://dev.bandwidth.com/voice/bxml/verbs/gather.html) verb allows us to specify a new URL to handle user input.

### Build the BXML

```python
sentence = 'Hello, let\'s play a game. What is 9 + 2'
voice = 'kate'
speak_sentence = SpeakSentence(sentence, voice)
gather = Gather(max_digits=2,
                first_digit_timeout=10,
                gather_url='/Callbacks/Voice/Gather',
                speak_sentence=speak_sentence)
response = Response()
response.add_verb(gather)
bxml = response.to_bxml()
print(bxml)
return bxml
```

### Handle the Gather Callback

#### Create the endpoint

* We need to define a new route for the gather event.

```python
@app.route("/Callbacks/Voice/Gather", methods=["POST"])
def handle_voice_callback_gather():
  return ""

```

#### Extract Digits

* We need to pull the `digits` pressed values out of the callback to check if their arithmetic is correct

```python
data = json.loads(request.data)
digits = data['digits']
```

#### Check digit value

* If the math is correct, play success file, if not play fail file

```python
success_file = 'https://bw-demo.s3.amazonaws.com/tada.wav'
fail_file = 'https://bw-demo.s3.amazonaws.com/fail.wav'
audio_uri = success_file if digits == '11' else fail_file
```

#### Build and respond with the BXML

```python
play_audio = PlayAudio(url=audio_uri)
hangup = Hangup()
response = Response()
response.add_verb(play_audio)
response.add_verb(hangup)
bxml = response.to_bxml()
print(bxml)
return bxml
```

### All together the voice handlers look like:

```python
@app.route("/Callbacks/Voice/Inbound", methods=["POST"])
def handle_voice_callback_inbound():
    sentence = 'Hello, let\'s play a game. What is 9 + 2'
    voice = 'kate'
    speak_sentence = SpeakSentence(sentence, voice)
    gather = Gather(max_digits=2,
                    first_digit_timeout=10,
                    gather_url='/Callbacks/Voice/Gather',
                    speak_sentence=speak_sentence)
    response = Response()
    response.add_verb(gather)
    bxml = response.to_bxml()
    print(bxml)
    return bxml


@app.route("/Callbacks/Voice/Gather", methods=["POST"])
def handle_voice_callback_gather():
    data = json.loads(request.data)
    digits = data['digits']
    success_file = 'https://bw-demo.s3.amazonaws.com/tada.wav'
    fail_file = 'https://bw-demo.s3.amazonaws.com/fail.wav'
    audio_uri = success_file if digits == '11' else fail_file
    play_audio = PlayAudio(url=audio_uri)
    hangup = Hangup()
    response = Response()
    response.add_verb(play_audio)
    response.add_verb(hangup)
    bxml = response.to_bxml()
    print(bxml)
    return bxml
```
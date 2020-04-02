# Bandwidth Ruby Webinar Example

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
gem install bundler
bundle install
ruby app.rb
```


## What You Can Do

* Text your phone number `dog` and you will receive a picture of a dog sent back
* Text your phone number any phrase other than `dog` and you will receive a response with the current date-time
* Call your phone number and you will be asked to play a game


# Tutorial

## Assumptions

* Have Bandwidth Account
* Have Ruby Installed (along with rubygems)
* Have [ngrok](https://ngrok.com) installed

## Code-along

### Intialize Bandwidth client

* Check environment variables and define client

```ruby
begin
  BANDWIDTH_ACCOUNT_ID               = ENV.fetch('BANDWIDTH_ACCOUNT_ID')
  BANDWIDTH_API_USER                 = ENV.fetch('BANDWIDTH_API_USER')
  BANDWIDTH_API_PASSWORD             = ENV.fetch('BANDWIDTH_API_PASSWORD')
  BANDWIDTH_MESSAGING_TOKEN          = ENV.fetch('BANDWIDTH_MESSAGING_TOKEN')
  BANDWIDTH_MESSAGING_SECRET         = ENV.fetch('BANDWIDTH_MESSAGING_SECRET')
  BANDWIDTH_MSG_APPLICATION_ID       = ENV.fetch('BANDWIDTH_MESSAGING_APPLICATION_ID')
  BANDWIDTH_VOICE_APPLICATION_ID     = ENV.fetch('BANDWIDTH_VOICE_APPLICATION_ID')
rescue
  puts 'Please set the environmental variables defined in the README'
  exit(-1)
end

bandwidth_client = Bandwidth::Client.new(
  voice_basic_auth_user_name: BANDWIDTH_API_USER,
  voice_basic_auth_password: BANDWIDTH_API_PASSWORD,
  messaging_basic_auth_user_name: BANDWIDTH_MESSAGING_TOKEN,
  messaging_basic_auth_password: BANDWIDTH_MESSAGING_SECRET,
)
```

## Handling message callbacks

* For this guide, we're only actually hitting the Bandwidth API on inbound messages
* Parse out the callback using the APIHelper tools

```ruby
raw_data = Bandwidth::APIHelper::json_deserialize(request.body.read).pop
messaging_callback = BandwidthCallbackMessage.from_hash(raw_data)
message = messaging_callback.message
```

### Check if DLR

* Bandwidth's messaging API sends both inbound message events and outbound DLRs to the same URL
* We need to check the direction of the message to determine actions.
  * for outbound messages, print the status and move on

```ruby
is_dlr = message.direction.downcase.strip == 'out'
if is_dlr
  log_message = 'Callback Received for: MessageId: %s, status: %s'
  puts format(log_message, message.id, messaging_callback.description)
  return 'Received Callback'
end
```

### Build the 'to' array

* As we're responding to any inbound message, if it's a group message we should reply to the group

```ruby
owner = message.owner
to_numbers = message.to.clone
to_numbers.delete(owner)
to_numbers.push(message.from)
```

### Build the message request

* Most of the message request is similar regardless of the inbound text content.
* So let's go ahead and build the skeleton request and fill in later

```ruby
message_request = MessageRequest.new(
  BANDWIDTH_MSG_APPLICATION_ID,
  to_numbers,
  owner
)
```

### Check if dog

* If the inbound message is "dog" we're going to send a picture
* Otherwise, we're going to reply to the message

```ruby
message_text = message.text.downcase.strip
case message_text
when 'dog'
  message_request.text = '🐶'
  message_request.media = ['https://bw-demo.s3.amazonaws.com/dog.jpg']
else
  message_request.text = '👋 Hello From bandwidth!'
end
```

### Build the client and send the message

* Now that we have the message, let's send it and log the response

```ruby
messaging_client = bandwidth_client.messaging_client.client
message_response = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID,
                                                   body: message_request)
log_message = 'Sent message with MessageId: %s'
puts format(log_message, message_response.data.id)

return 'Handle messaging callback'
```

### All together the messaging handler looks like

```ruby
post '/Callbacks/Messaging' do
  raw_data = Bandwidth::APIHelper::json_deserialize(request.body.read).pop
  messaging_callback = BandwidthCallbackMessage.from_hash(raw_data)
  message = messaging_callback.message
  is_dlr = message.direction.downcase.strip == 'out'
  if is_dlr
    log_message = 'Callback Received for: MessageId: %s, status: %s'
    puts format(log_message, message.id, messaging_callback.description)
    return 'Received Callback'
  end

  owner = message.owner
  to_numbers = message.to.clone
  to_numbers.delete(owner)
  to_numbers.push(message.from)
  message_request = MessageRequest.new(
    BANDWIDTH_MSG_APPLICATION_ID,
    to_numbers,
    owner
  )
  message_text = message.text.downcase.strip
  case message_text
  when 'dog'
    message_request.text = '🐶'
    message_request.media = ['https://bw-demo.s3.amazonaws.com/dog.jpg']
  else
    message_request.text = '👋 Hello From bandwidth!'
  end
  messaging_client = bandwidth_client.messaging_client.client
  message_response = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID,
                                                     body: message_request)
  log_message = 'Sent message with MessageId: %s'
  puts format(log_message, message_response.data.id)

  return 'Handle messaging callback'
end
```

## Handling Voice callbacks

* We're always replying with the same BXML for each call
* Don't need to concern ourselves with details about the callback event
* The [Gather](https://dev.bandwidth.com/voice/bxml/verbs/gather.html) verb allows us to specify a new URL to handle user input.

### Build the BXML

```ruby
sentence = 'Hello, let\'s play a game. What is 9 + 2'
voice = 'kate'
speak_sentence = SpeakSentence.new({ sentence: sentence,
                                     voice: voice })
gather = Gather.new({ max_digits: 2,
                      first_digit_timeout: 10,
                      gather_url: '/Callbacks/Voice/Gather',
                      speak_sentence: speak_sentence })
response = Bandwidth::Voice::Response.new
response.push(gather)
bxml = response.to_bxml
puts bxml
return bxml
```

### Handle the Gather Callback

* We need to pull the `digits` pressed values out of the callback to check if their arithmetic is correct

```ruby
data = JSON.parse(request.body.read)
digits = data['digits']
```

#### Check digit value

* If the math is correct, play success file, if not play fail file

```ruby
success_file = 'https://bw-demo.s3.amazonaws.com/tada.wav'
fail_file = 'https://bw-demo.s3.amazonaws.com/fail.wav'
audio_uri = digits == '11' ? success_file : fail_file
```

#### Build and respond with the BXML

```ruby
play_audio = PlayAudio.new({ url: audio_uri })
hangup = Hangup.new
response = Response.new
response.push(play_audio)
response.push(hangup)

bxml = response.to_bxml
puts bxml
return bxml
```

### All together the voice handlers look like:

```ruby
post '/Callbacks/Voice/Inbound' do
  sentence = 'Hello, let\'s play a game. What is 9 + 2'
  voice = 'kate'
  speak_sentence = SpeakSentence.new({ sentence: sentence,
                                       voice: voice })
  gather = Gather.new({ max_digits: 2,
                        first_digit_timeout: 10,
                        gather_url: '/Callbacks/Voice/Gather',
                        speak_sentence: speak_sentence })
  response = Bandwidth::Voice::Response.new
  response.push(gather)
  bxml = response.to_bxml
  puts bxml
  return bxml
end

post '/Callbacks/Voice/Gather' do
  data = JSON.parse(request.body.read)
  digits = data['digits']
  success_file = 'https://bw-demo.s3.amazonaws.com/tada.wav'
  fail_file = 'https://bw-demo.s3.amazonaws.com/fail.wav'
  audio_uri = digits == '11' ? success_file : fail_file

  play_audio = PlayAudio.new({ url: audio_uri })
  hangup = Hangup.new
  response = Response.new
  response.push(play_audio)
  response.push(hangup)

  bxml = response.to_bxml
  puts bxml
  return bxml
end
```
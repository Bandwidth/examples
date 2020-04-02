# frozen_string_literal: true
# app.rb
#
# A template to create Sinatra apps that utilize Bandwidth's APIs
#
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth'

include Bandwidth
include Bandwidth::Messaging
include Bandwidth::Voice

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


get '/' do
  return 'Hello world'
end

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

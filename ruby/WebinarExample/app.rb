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
  BANDWIDTH_MESSAGING_APPLICATION_ID = ENV.fetch('BANDWIDTH_MESSAGING_APPLICATION_ID')
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

$voice_client = bandwidth_client.voice_client.client
$messaging_client = bandwidth_client.messaging_client.client

get '/' do
  return 'Hello world'
end

post '/Create/Message' do
  data = JSON.parse(request.body.read)
  body = MessageRequest.new
  body.application_id = BANDWIDTH_MESSAGING_APPLICATION_ID
  body.to = [data['to']]
  body.from = data['from']
  body.text = data['text']
  $messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, body: body)
  return 'Send a text message'
end

post '/Create/Call' do
  data = JSON.parse(request.body.read)
  body = ApiCreateCallRequest.new
  body.to = data['to']
  body.from = data['from']
  body.answer_url = data['answerUrl']
  body.application_id = VOICE_APPLICATION_ID
  $voice_client.create_call(BANDWIDTH_ACCOUNT_ID ,body: body)
  return 'Make a phone call'
end

post '/Callbacks/Messaging' do
  raw_data = Bandwidth::APIHelper::json_deserialize(request.body.read).pop
  messaging_callback = BandwidthCallbackMessage.from_hash(raw_data)
  message = messaging_callback.message
  is_dlr = message.direction.downcase.strip == 'out'
  if is_dlr
    puts "Callback Received for: MessageId: #{message.id}, status: #{messaging_callback.description}"
    return 'Received Callback'
  end
  owner = message.owner
  to_numbers = message.to.clone
  to_numbers.delete(owner)
  to_numbers.push(message.from)
  message_request = MessageRequest.new(
      application_id=BANDWIDTH_MESSAGING_APPLICATION_ID,
      to=to_numbers,
      from=owner)
  message_text = message.text.downcase.strip
  case message_text
  when 'dog'
    message_request.text = '🐶'
    message_request.media = ['https://bw-demo.s3.amazonaws.com/dog.jpg']
  else
    message_request.text = '👋 Hello From bandwidth!'
  end

  message_response = $messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, body: message_request)
  puts "Sent message with MessageId: #{message_response.data.id}"

  return 'Handle messaging callback'
end


post '/Callbacks/Voice/Inbound' do
  data = JSON.parse(request.body.read)
  return 'Handle voice inbound callback'
end

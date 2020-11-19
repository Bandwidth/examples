#
# app.rb
#
# A simple app that demonstrates using Bandwidth's create call API and Gather BXML

require 'sinatra'
require 'bandwidth'
require 'json'

include Bandwidth
include Bandwidth::Voice

begin
    ACCOUNT_ID = ENV.fetch("ACCOUNT_ID")
    API_USERNAME = ENV.fetch("API_USERNAME")
    API_PASSWORD = ENV.fetch("API_PASSWORD")
    VOICE_APPLICATION_ID = ENV.fetch("VOICE_APPLICATION_ID")
    BASE_URL = ENV.fetch("BASE_URL")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

bandwidth_client = Bandwidth::Client.new(
    voice_basic_auth_user_name: API_USERNAME,
    voice_basic_auth_password: API_PASSWORD
)

$voice_client = bandwidth_client.voice_client.client

post '/outboundCall' do
  data = JSON.parse(request.body.read)
  body = ApiCreateCallRequest.new
  body.to = data['to']
  body.from = data['from']
  body.answer_url = BASE_URL + "/voiceCallback"
  body.application_id = VOICE_APPLICATION_ID

  begin
    result = $voice_client.create_call(ACCOUNT_ID ,body: body)
    response = {
        :success => true
    }
    status 200
    return response.to_json
  rescue ApiErrorResponseException => e
    response = {
        :success => false,
        :error => e.description
    }
    status 400
    return response.to_json
  end 
end

post '/voiceCallback' do
  data = JSON.parse(request.body.read)
  response = Bandwidth::Voice::Response.new()
  if data['eventType'] == 'answer'
    speak_sentence = Bandwidth::Voice::SpeakSentence.new({
      :sentence => 'Hit 1 for option 1. Hit 2 for option 2. Then hit #'
    })
    gather = Bandwidth::Voice::Gather.new({
      :gather_url => '/gatherCallback',
      :terminating_digits => '#',
      :repeat_count => '3',
      :speak_sentence => speak_sentence
    })
    response.push(gather)
  elsif data['eventType'] == 'disconnect'
    puts "Disconnect event received. Call ended"
    status 200
    return 'Ok'
  else
    speak_sentence = Bandwidth::Voice::SpeakSentence.new({
      :sentence => data['eventType'] + ' event received. Ending call'
    })
    response.push(speak_sentence)
  end

  status 200
  return response.to_bxml()
end

post '/gatherCallback' do
  data = JSON.parse(request.body.read)
  response = Bandwidth::Voice::Response.new()
  if data['eventType'] == 'gather'
    speak_sentence = nil
    if data['digits'] == '1'
      speak_sentence = Bandwidth::Voice::SpeakSentence.new({
        :sentence => 'You have chosen option 1. Thank you'
      })
    elsif data['digits'] == '2'
      speak_sentence = Bandwidth::Voice::SpeakSentence.new({
        :sentence => 'You have chosen option 2. Thank you'
      })
    else
      speak_sentence = Bandwidth::Voice::SpeakSentence.new({
        :sentence => 'Invalid option'
      })
    end
    response.push(speak_sentence)
  else
    speak_sentence = Bandwidth::Voice::SpeakSentence.new({
      :sentence => data['eventType'] + " received, ending call."
    })
    response.push(speak_sentence)
  end

  status 200
  return response.to_bxml()
end

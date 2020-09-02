# frozen_string_literal: true
# app.rb
#
# A template to create Sinatra apps that utilize Bandwidth's APIs
#
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth'
require 'uri'


include Bandwidth
include Bandwidth::Voice

begin
  BANDWIDTH_ACCOUNT_ID               = ENV.fetch('BANDWIDTH_ACCOUNT_ID')
  BANDWIDTH_API_USER                 = ENV.fetch('BANDWIDTH_API_USER')
  BANDWIDTH_API_PASSWORD             = ENV.fetch('BANDWIDTH_API_PASSWORD')
  BANDWIDTH_VOICE_APPLICATION_ID     = ENV.fetch('BANDWIDTH_VOICE_APPLICATION_ID')
  PERSONAL_NUMBER                    = ENV.fetch('PERSONAL_NUMBER')
  BASE_URL                           = ENV.fetch('BASE_URL') # in 123456abcd.ngrok.io format - no 'http://' or trailing '/'
rescue
  puts 'Please set the environmental variables defined in the README'
  exit(-1)
end

bandwidth_client = Bandwidth::Client.new(
  voice_basic_auth_user_name: BANDWIDTH_API_USER,
  voice_basic_auth_password: BANDWIDTH_API_PASSWORD
)

$voice_client = bandwidth_client.voice_client.client

def createOutboundCall(to, from, callId)
  """
  Create the outbound call
  """
  body = ApiCreateCallRequest.new
  body.from = from
  body.to = PERSONAL_NUMBER
  body.answer_url = URI::HTTP.build(host: BASE_URL, path: '/Outbound/Answer')
  body.application_id = BANDWIDTH_VOICE_APPLICATION_ID
  body.tag = callId
  body.disconnect_url = URI::HTTP.build(host: BASE_URL, path: '/Disconnect')
  body.disconnect_method = 'POST'
  begin
      result = $voice_client.create_call(BANDWIDTH_ACCOUNT_ID, :body => body)
  rescue Exception => e
      puts e
  end
end


def updateCall(callId)
  """
  Update the original inbound call to redirect to /UpdateCall
  """
  body = ApiModifyCallRequest.new
  body.redirect_url = URI::HTTP.build(host: BASE_URL, path: '/UpdateCall')
  body.state = "active"
  begin
      $voice_client.modify_call(BANDWIDTH_ACCOUNT_ID, callId, :body => body)
  rescue Exception => e
      puts e
  end
end


# Define routes
post '/Inbound/VoiceCallback' do
  """
  Handle the inbound call (A-Leg)

  Returns ringing bxml and creates the outbound call (B-leg)
  """
  data = JSON.parse(request.body.read)
  createOutboundCall(data['to'], data['from'], data['callId'])

  response = Bandwidth::Voice::Response.new()
  speak_sentence = Bandwidth::Voice::SpeakSentence.new({
      :sentence => "Connecting your call, please wait.",
      :voice => "julie"
  })
  ring = Bandwidth::Voice::Ring.new({
    :duration => '30'
  })
  redirect = Bandwidth::Voice::Redirect.new({
    :redirect_url => URI::HTTP.build(host: BASE_URL, path: '/UpdateCall')
  })
  response.push(speak_sentence)
  response.push(ring)
  response.push(redirect)
  status 200
  return response.to_bxml()
end


post '/Outbound/Answer' do
  """
  Perform a gather on the outbound call (B-leg) to determine if they want to accept or reject the incoming call
  """
  data = JSON.parse(request.body.read)
  if data['eventType'] != 'answer'
    return updateCall(data['tag'])
  else
    response = Bandwidth::Voice::Response.new()
    speak_sentence = Bandwidth::Voice::SpeakSentence.new({
        :sentence => "Please press 1 to accept the call, or any other button to send to voicemail",
        :voice => "julie"
    })
    gather = Bandwidth::Voice::Gather.new({
        :gather_url => URI::HTTP.build(host: BASE_URL, path: '/Outbound/Gather'),
        :terminating_digits => "#",
        :max_digits => '1',
        :first_digit_timeout => "10",
        :speak_sentence => speak_sentence,
        :tag => data['tag']
    })
    response.push(gather)
    status 200
    return response.to_bxml()
  end
end


post '/Outbound/Gather' do
  """
  Process the result of the gather event and either bridge the calls, or update the A-leg
  """
  data = JSON.parse(request.body.read)
  if data['digits'] == '1'
    response = Bandwidth::Voice::Response.new()
    speak_sentence = Bandwidth::Voice::SpeakSentence.new({
        :sentence => "The bridge will start now",
        :voice => "julie"
    })
    bridge = Bandwidth::Voice::Bridge.new({
        :call_id => data['tag']
    })
    response.push(speak_sentence)
    response.push(bridge)
    status 200
    return response.to_bxml()
  else
    updateCall(data['tag'])
    status 204
  end
end


post '/Disconnect' do
  """
  Handle any disconnect events related to the B-leg and update the A-leg accordingly
  """
  data = JSON.parse(request.body.read)
  if data['eventType'] != 'timeout'
    updateCall(data['tag'])
    status 204
  end
end


post '/UpdateCall' do
  """
  In the event of a timeout or call screen, update the A-leg call with record bxml to capture a voicemail
  """
  data = JSON.parse(request.body.read)
  response = Bandwidth::Voice::Response.new()
  speak_sentence = Bandwidth::Voice::SpeakSentence.new({
      :sentence => "The person you are trying to reach is not available, please leave a message at the tone",
      :voice => "julie"
  })
  play_audio = Bandwidth::Voice::PlayAudio.new({
    :url => "https://www.soundjay.com/button/sounds/beep-01a.wav"
  })
  record = Bandwidth::Voice::Record.new({
      :recording_available_url => URI::HTTP.build(host: BASE_URL, path: '/Recording'),
      :max_duration => "30"
  })
  response.push(speak_sentence)
  response.push(play_audio)
  response.push(record)
  status 200
  return response.to_bxml()
end


post '/Recording' do
  """
  Trigger the download of the recorded voicemail upon completion callback from bandwidth
  """
  data = JSON.parse(request.body.read)
  File.open("./Recordings/" + data['recordingId'].to_s + '.wav', "wb") do |f|
    response = $voice_client.get_stream_recording_media(BANDWIDTH_ACCOUNT_ID, data['callId'], data['recordingId'])
    f.puts(response.data)
  end
  status 204
end


post '/Status' do
  """
  Capture call status
  """
  data = JSON.parse(request.body.read)
  puts "Call State: " + data['state']
  status 204
end

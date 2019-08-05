# voice_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Voice API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth'

include Bandwidth::Voice
include Bandwidth

VOICE_ACCOUNT_ID = (ENV.has_key?("VOICE_ACCOUNT_ID") ? ENV["VOICE_ACCOUNT_ID"]: nil)
VOICE_API_USERNAME = (ENV.has_key?("VOICE_API_USERNAME") ? ENV["VOICE_API_USERNAME"]: nil)
VOICE_API_PASSWORD = (ENV.has_key?("VOICE_API_PASSWORD") ? ENV["VOICE_API_PASSWORD"]: nil)
VOICE_APPLICATION_ID = (ENV.has_key?("VOICE_APPLICATION_ID") ? ENV["VOICE_APPLICATION_ID"]: nil)
BASE_URL = (ENV.has_key?("BASE_URL") ? ENV["BASE_URL"]: nil)

if [VOICE_ACCOUNT_ID, VOICE_API_USERNAME, VOICE_API_PASSWORD, VOICE_APPLICATION_ID, BASE_URL].include?(nil)
    puts "Please set the VOICE environmental variables defined in the README"
    exit(-1)
end

client = Bandwidth::Client.new(
    voice_basic_auth_user_name:VOICE_API_USERNAME,
    voice_basic_auth_password:VOICE_API_PASSWORD
)

$calls_controller = client.voice_client.calls

#Shows how to handle inbound Bandwidth voice callbacks
post "/VoiceCallback" do
    pause = Bandwidth::Voice::Pause.new({
        :duration => 3
    })
    speak_sentence_1 = Bandwidth::Voice::SpeakSentence.new({
        :sentence => "Let's play a game",
        :voice => "susan",
        :locale => "en_US",
        :gender => "female"
    })
    speak_sentence_2 = Bandwidth::Voice::SpeakSentence.new({
        :sentence => "What is 6 plus 4",
        :voice => "susan",
        :locale => "en_US",
        :gender => "female"
    })
    redirect = Bandwidth::Voice::Redirect.new({
        :redirect_url => "/StartGatherGame"
    })
    response = Bandwidth::Voice::Response.new()
    response.push(pause)
    response.push(speak_sentence_1)
    response.push(pause)
    response.push(speak_sentence_2)
    response.push(redirect)

    return response.to_xml()
end

#Callback endpoint that returns BXML for making a gather
post "/StartGatherGame" do
    gather = Bandwidth::Voice::Gather.new({
        :gather_url => "/EndGatherGame",
        :max_digits => 2
    })
    response = Bandwidth::Voice::Response.new()
    response.push(gather)

    return response.to_xml()
end

CORRECT_URL = "https://www.kozco.com/tech/piano2.wav"
INCORRECT_URL = "https://www32.online-convert.com/dl/web2/download-file/c4ec8291-ddd7-4982-b2fb-4dec2f37dcf4/Never%20Gonna%20Give%20You%20Up%20Original.wav"
#Callback endpoint that expects a gather callback
post "/EndGatherGame" do
    data = JSON.parse(request.body.read)

    digits = data["digits"].to_i

    audio_url = nil

    if digits == 10
        audio_url = CORRECT_URL
    else
        audio_url = INCORRECT_URL
    end

    play_audio = Bandwidth::Voice::PlayAudio.new({
        :url => audio_url
    })

    response = Bandwidth::Voice::Response.new()
    response.push(play_audio)

    return response.to_xml()
end

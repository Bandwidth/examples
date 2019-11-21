#
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
    MESSAGING_ACCOUNT_ID = ENV.fetch("MESSAGING_ACCOUNT_ID")
    MESSAGING_API_TOKEN = ENV.fetch("MESSAGING_API_TOKEN")
    MESSAGING_API_SECRET = ENV.fetch("MESSAGING_API_SECRET")
    MESSAGING_APPLICATION_ID = ENV.fetch("MESSAGING_APPLICATION_ID")
    VOICE_ACCOUNT_ID = ENV.fetch("VOICE_ACCOUNT_ID")
    VOICE_API_USERNAME = ENV.fetch("VOICE_API_USERNAME")
    VOICE_API_PASSWORD = ENV.fetch("VOICE_API_PASSWORD")
    VOICE_APPLICATION_ID = ENV.fetch("VOICE_APPLICATION_ID")
    BASE_URL = ENV.fetch("BASE_URL")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

bandwidth_client = Bandwidth::Client.new(
    voice_basic_auth_user_name: VOICE_API_USERNAME,
    voice_basic_auth_password: VOICE_API_PASSWORD,
    messaging_basic_auth_user_name: MESSAGING_API_TOKEN,
    messaging_basic_auth_password: MESSAGING_API_SECRET,
)

$voice_client = bandwidth_client.voice_client.client
$messaging_client = bandwidth_client.messaging_client.client

get "/" do
    return "Hello world"
end

post "/Create/Message" do
    data = JSON.parse(request.body.read)
    return "Send a text message"
end

post "/Create/Call" do
    data = JSON.parse(request.body.read)
    return "Make a phone call"
end

post "/Callbacks/Messaging" do
    data = JSON.parse(request.body.read)
    return "Handle messaging callback"
end

post "/Callbacks/Voice/Outbound" do
    data = JSON.parse(request.body.read)
    return "Handle voice outbound callback"
end

post "/Callbacks/Voice/Inbound" do
    data = JSON.parse(request.body.read)
    return "Handle voice inbound callback"
end

post "/Bxml" do
    data = JSON.parse(request.body.read)
    response = Bandwidth::Voice::Response.new()
    #Add more verbs here
    return response.to_bxml()
end

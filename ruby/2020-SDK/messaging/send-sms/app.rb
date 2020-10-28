#app.rb
#
#A simple sinatra server that handles interactions with Bandwidth's messaging API

require 'sinatra'
require 'bandwidth'

include Bandwidth
include Bandwidth::Messaging

bandwidth_client = Bandwidth::Client.new(
    messaging_basic_auth_user_name: "username",
    messaging_basic_auth_password: "password"
)
messaging_client = bandwidth_client.messaging_client.client

account_id = "id"
application_id = "id"

post '/messageCallback' do
    #Log the SMS callbacks
    data = JSON.parse(request.body.read)
    if data[0]["type"] == "message-received"
        puts data
    elsif data[0]["type"] == "message-sending"
        puts data
    elsif data[0]["type"] == "message-delivered"
        puts data
    elsif data[0]["type"] == "message-failed"
        puts data
    end

    return ''
end

post '/outboundMessage' do
    #Make a POST request to this URL to send a text message
    data = JSON.parse(request.body.read)
    puts data

    body = MessageRequest.new
    body.application_id = application_id
    body.to = [data["to"]]
    body.from = data["from"]
    body.text = data["text"]

    begin
        messaging_client.create_message(account_id, :body => body)
        return {
            :success => true
        }.to_json
    rescue Bandwidth::MessagingException => e
        status 400
        return {
            :success => false,
            :error => e.description
        }.to_json
    end
end

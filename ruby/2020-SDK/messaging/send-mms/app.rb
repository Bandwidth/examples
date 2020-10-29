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
    #Log the MMS callbacks
    data = JSON.parse(request.body.read)

    if data[0]["type"] == "message-received"
        puts data[0]["type"]
        puts data[0]["description"]
        if data[0]["message"].key?("media")
            puts "With media"

            data[0]["message"]["media"].each do |media|
                media_id = media.split("/").last(3)
                downloaded_media = messaging_client.get_media(account_id, media_id).data
                File.write(media_id, downloaded_media, "wb")
                puts "media saved to %s" % [media_id]
            end
        else
            puts "With no media"
        end
    elsif data[0]["type"] == "message-sending"
        puts data[0]["type"]
        puts data[0]["description"]
        puts "Messaging sending is for MMS only"
    elsif data[0]["type"] == "message-delivered"
        puts data[0]["type"]
        puts data[0]["description"]
        puts "Messaging has been delivered"
    elsif data[0]["type"] == "message-failed"
        puts data[0]["type"]
        puts data[0]["description"]
        puts "Messaging delivery failed"
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
    body.media = ["https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg"]

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

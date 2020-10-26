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

post '/outboundMessage' do
    #Make a POST request to this URL to send a text message
    body = MessageRequest.new
    body.application_id = "id"
    body.to = ["+1to"]
    body.from = "+1from"
    body.text = "Hello from Bandwidth"

    messaging_client.create_message(account_id, :body => body)

    return ''
end

post '/messageCallback' do
    #This URL handles callbacks from Bandwidth. All messaging callbacks (inbound and outbound)
    #will come to this URL. The message type must be checked to know if it's an inbound or
    #outbound message.
    #If the inbound message contains media, that media is downloaded
    data = JSON.parse(request.body.read)
    if data[0]["type"] == "message-received"
        puts "Message received"
        puts data
        if data[0]["message"].key?("media")
            data[0]["message"]["media"].each do |media|
                media_id = media.split("/").last(3)
                downloaded_media = messaging_client.get_media(account_id, media_id).data
                puts downloaded_media
            end
        end
    else
        puts data
    end

    return ''
end

post '/mediaManagement' do
    #Make a POST request to this endpoint to upload a media file to Bandwidth, then download it
    #and print its contents
    media = "simple text string"
    media_id = "bandwidth-sample-app"

    messaging_client.upload_media(account_id, media_id, media.length.to_s, media, :content_type => "application/octet-stream", :cache_control => "no-cache")

    downloaded_media = messaging_client.get_media(account_id, media_id).data
    puts downloaded_media

    return ''
end

post '/outboundMediaMessage' do
    #Make a post request to this url to send outbound MMS with media

    #Media previously uploaded to bandwidth
    body = MessageRequest.new
    body.application_id = "id"
    body.to = ["+1to"]
    body.from = "+1from"
    body.text = "Hello from Bandwidth"
    body.media = ["https://messaging.bandwidth.com/api/v2/users/%s/media/bandwidth-sample-app" % [account_id]]

    messaging_client.create_message(account_id, :body => body)

    #Media not on bandwidth
    body = MessageRequest.new
    body.application_id = "id"
    body.to = ["+1to"]
    body.from = "+1from"
    body.text = "Hello from Bandwidth"
    body.media = ["https://assets1.ignimgs.com/2019/09/04/super-mario-world---button-fin-1567640652381.jpg"]

    messaging_client.create_message(account_id, :body => body)
    return ''
end

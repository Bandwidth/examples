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

post '/mediaManagement' do
    #Uploads media to Bandwidth's Messaging PI
    media = "simple text string"
    media_id = "bandwidth-sample-app"

    messaging_client.upload_media(account_id, media_id, media.length.to_s, media, :content_type => "application/octet-stream", :cache_control => "no-cache")

    return ''
end

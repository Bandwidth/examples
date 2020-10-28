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
    #Downloads media from Bandwidth's Messaging API
    media_id = "bandwidth-sample-app"

    downloaded_media = messaging_client.get_media(account_id, media_id).data
    puts downloaded_media

    return ''
end

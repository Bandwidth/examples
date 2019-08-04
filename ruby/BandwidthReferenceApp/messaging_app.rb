# messaging_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Messaging API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth_messaging'

include BandwidthMessaging

MESSAGING_ACCOUNT_ID = (ENV.has_key?("MESSAGING_ACCOUNT_ID") ? ENV["MESSAGING_ACCOUNT_ID"]: nil)
MESSAGING_API_TOKEN = (ENV.has_key?("MESSAGING_API_TOKEN") ? ENV["MESSAGING_API_TOKEN"]: nil)
MESSAGING_API_SECRET = (ENV.has_key?("MESSAGING_API_SECRET") ? ENV["MESSAGING_API_SECRET"]: nil)
MESSAGING_APPLICATION_ID = (ENV.has_key?("MESSAGING_APPLICATION_ID") ? ENV["MESSAGING_APPLICATION_ID"]: nil)

if [MESSAGING_ACCOUNT_ID, MESSAGING_API_TOKEN, MESSAGING_API_SECRET, MESSAGING_APPLICATION_ID].include?(nil)
    puts "Please set the MESSAGING environmental variables defined in the README"
    exit(-1)
end

messaging_client = BandwidthMessagingClient.new(basic_auth_user_name: MESSAGING_API_TOKEN, basic_auth_password: MESSAGING_API_SECRET)

messaging_controller = messaging_client.client

# Takes information from a Bandwidth inbound message callback and initiates a call.
#
# @param to [list<String>] The list of phone numbers that received the message 
# @param from [String] The number that received the message
# @return [nil] 
def handle_inbound_sms_call_me(to, from)
    puts to
    puts from
end

# Take information from a Bandwidth inbound message callback and responds with
#    a text message with the current date and time.
#
# @param to [list<String>] The list of phone numbers that received the message
# @param from [String] The phone number that sent the text message
# @return [nil]
def handle_inbound_sms(to, from)
    puts to
    puts from
end

# Takes information from a Bandwidth inbound message callback that includes media
#    and responds with a text message containing the same media
#    sent through Bandwidth's media resource.
# @param to [list<String>] The list of phone numbers that received the message
# @param from [String] The phone number that sent the message
# @param media [list<String>] The list of media sent in the message
# @return [nil]
def handle_inbound_media_mms(to, from, media)
    puts to
    puts from
    puts media
end

post '/MessageCallback' do
    # A method for showing how to handle Bandwidth messaging callbacks.
    # For inbound SMS that contains the phrase "call me", a phone call is made and the user is asked to
    #    forward the call to another number
    # For inbound SMS that doesn't contain the phrase "call me", the response is a SMS with the date and time.
    # For inbound MMS with a media attachment, the response is the same
    #    media attachment sent through Bandwidth's media resource.
    # For all other events, the callback is logged to console
    data = JSON.parse(request.body.read)

    if data[0]["type"] == "message-received"
        if data[0]["message"]["text"].include?("call me")
            handle_inbound_sms_call_me(data[0]["message"]["to"][0], data[0]["message"]["from"])
        elsif data[0]["message"].include?("media")
            handle_inbound_media_mms(data[0]["message"]["to"][0], data[0]["message"]["from"], data[0]["message"]["media"])
        else
            handle_inbound_sms(data[0]["message"]["to"][0], data[0]["message"]["from"])
        end
    else
        print(data)
    end
    return ""
end

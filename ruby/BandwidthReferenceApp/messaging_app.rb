# messaging_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Messaging API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'

MESSAGING_ACCOUNT_ID = (ENV.has_key?("MESSAGING_ACCOUNT_ID") ? ENV["MESSAGING_ACCOUNT_ID"]: nil)
MESSAGING_API_TOKEN = (ENV.has_key?("MESSAGING_API_TOKEN") ? ENV["MESSAGING_API_TOKEN"]: nil)
MESSAGING_API_SECRET = (ENV.has_key?("MESSAGING_API_SECRET") ? ENV["MESSAGING_API_SECRET"]: nil)
MESSAGING_APPLICATION_ID = (ENV.has_key?("MESSAGING_APPLICATION_ID") ? ENV["MESSAGING_APPLICATION_ID"]: nil)

if [MESSAGING_ACCOUNT_ID, MESSAGING_API_TOKEN, MESSAGING_API_SECRET, MESSAGING_APPLICATION_ID].include?(nil)
    puts "Please set the MESSAGING environmental variables defined in the README"
    exit(-1)
end

get '/message' do
    return "Message"
end

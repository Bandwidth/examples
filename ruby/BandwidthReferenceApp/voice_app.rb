# voice_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Voice API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'

VOICE_ACCOUNT_ID = (ENV.has_key?("VOICE_ACCOUNT_ID") ? ENV["VOICE_ACCOUNT_ID"]: nil)
VOICE_API_USERNAME = (ENV.has_key?("VOICE_API_USERNAME") ? ENV["VOICE_API_USERNAME"]: nil)
VOICE_API_PASSWORD = (ENV.has_key?("VOICE_API_PASSWORD") ? ENV["VOICE_API_PASSWORD"]: nil)
VOICE_APPLICATION_ID = (ENV.has_key?("VOICE_APPLICATION_ID") ? ENV["VOICE_APPLICATION_ID"]: nil)

if [VOICE_ACCOUNT_ID, VOICE_API_USERNAME, VOICE_API_PASSWORD, VOICE_APPLICATION_ID].include?(nil)
    puts "Please set the VOICE environmental variables defined in the README"
    exit(-1)
end

get '/voice' do
  return "Voice"
end

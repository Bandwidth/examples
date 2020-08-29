# frozen_string_literal: true
# app.rb
#
# A template to create Sinatra apps that utilize Bandwidth's APIs
#
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth'

include Bandwidth
include Bandwidth::Voice

begin
  BANDWIDTH_ACCOUNT_ID               = ENV.fetch('BANDWIDTH_ACCOUNT_ID')
  BANDWIDTH_API_USER                 = ENV.fetch('BANDWIDTH_API_USER')
  BANDWIDTH_API_PASSWORD             = ENV.fetch('BANDWIDTH_API_PASSWORD')
  BANDWIDTH_VOICE_APPLICATION_ID     = ENV.fetch('BANDWIDTH_VOICE_APPLICATION_ID')
rescue
  puts 'Please set the environmental variables defined in the README'
  exit(-1)
end

bandwidth_client = Bandwidth::Client.new(
  voice_basic_auth_user_name: BANDWIDTH_API_USER,
  voice_basic_auth_password: BANDWIDTH_API_PASSWORD
)


# Create functions for creating outbound call and updating a-Leg
def createOutboundCall(to, from, callId)

end


def updateCall(callId)

end


# Define routes
post '/Inbound/VoiceCallback' do

end


post '/Outbound/Answer' do

end


post '/Outbound/Gather' do

end


post '/Disconnect' do

end


post '/UpdateCall' do

end


post '/Recording' do

end


post '/Status' do

end

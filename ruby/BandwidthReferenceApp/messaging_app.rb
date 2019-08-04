# messaging_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Messaging API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'

get '/message' do
  return "Message"
end

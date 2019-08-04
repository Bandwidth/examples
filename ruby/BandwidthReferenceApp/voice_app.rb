# voice_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Voice API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'

get '/voice' do
  return "Voice"
end

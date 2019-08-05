# app.rb
#
# A simple Sinatra app to run the messaging and voice apps in the repo
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'

set :port, 5000

require_relative 'messaging_app'
require_relative 'voice_app'

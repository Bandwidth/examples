# phone_number_ordering.rb
#
# A simple Sinatra app to demonstrate number ordering through Bandwidth's API
#
# @copyright Bandwidth INC

require 'ruby-bandwidth-iris'
require 'sinatra'

# Generates a consistent JSON error response body
#
# @param type [String] The type of error
# @param description [String] Error description
# @param bandwidth_error_code [String] Error code returned by Bandwidth
# @param bandwidth_error_description [String] Error description returned by Bandwidth
# @return String
def error(type, description, bandwidth_error_code, bandwidth_error_description)
    return ""
end

post '/subscriptions/orders' do
    data = request.body.read
    return data
end

post '/subscriptions/disconnects' do
    data = request.body.read
    return data
end

get '/availablePhoneNumbers' do
    return params
end

post '/phoneNumbers' do
    data = JSON.parse(request.body.read)
    return data
end

get '/phoneNumbers' do
    return ""
end

delete '/phoneNumbers/:phoneNumber' do
    return params[:phoneNumber]
end

# phone_number_ordering.rb
#
# A simple Sinatra app to demonstrate number ordering through Bandwidth's API
#
# @copyright Bandwidth INC

require 'ruby-bandwidth-iris'
require 'sinatra'
require 'json'
require 'nokogiri'

begin
    IRIS_ACCOUNT_ID = ENV.fetch("IRIS_ACCOUNT_ID")
    IRIS_USERNAME = ENV.fetch("IRIS_USERNAME")
    IRIS_PASSWORD = ENV.fetch("IRIS_PASSWORD")
    SITE_ID = ENV.fetch("SITE_ID")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

BandwidthIris::Client.global_options = {
    :account_id => IRIS_ACCOUNT_ID,
    :username => IRIS_USERNAME,
    :password => IRIS_PASSWORD,
    :api_endpoint => "https://dashboard.bandwidth.com/api"
}

class PhoneNumbers
    def initialize()
        @phone_numbers = {} #maps a phone number to the phoneNumber/bandwidthOrderId structure
        @order_ids = {} #redundancy for quick conversion of an order id to its phone number if needed
    end

    # Adds a phone number and its order id to the in memory storage
    #
    # @param phone_number [String] The phone number to add
    # @param order_id [String] The order id of the phone number
    def add_phone_number(phone_number, order_id)
        @phone_numbers[phone_number] = {
            :phoneNumber => phone_number,
            :bandwidthOrderId => order_id
        }
        @order_ids[order_id] = phone_number
    end

    # Converts an order id to its phone number
    #
    # @param order_id [String] The order id
    # @return [String]
    # @raise [Exception] if the order id isn't found
    def order_id_to_phone_number(order_id)
        if @order_ids.has_key?(order_id)
            return @order_ids[order_id]
        else
            raise Exception.new("Order not found")
        end
    end

    # Removes a phone number from the in memory storage
    #
    # @param phone_number [String] The phone number to remove
    # @raise [Exception] if the number isn't found
    def remove_phone_number(phone_number)
        if phone_number_exists(phone_number)
            order_id = @phone_numbers[phone_number][:bandwidthOrderId]
            @phone_numbers.delete(phone_number)
            @order_ids.delete(order_id)
        else
            raise Exception.new("Phone number not found")
        end
    end

    # Returns a JSON string of all phone numbers
    #
    # @return [String]
    def get_phone_numbers_json()
        return @phone_numbers.values.to_json()
    end


    # Returns true if the phone number exists, false otherwise
    #
    # @param phone_number [String] The phone number to check
    # @return [Boolean]
    def phone_number_exists(phone_number)
        return @phone_numbers.has_key?(phone_number)
    end
end

phone_numbers = PhoneNumbers.new()

# Generates a consistent JSON error response body
#
# @param type [String] The type of error
# @param description [String] Error description
# @param bandwidth_error_code [String] Error code returned by Bandwidth
# @param bandwidth_error_description [String] Error description returned by Bandwidth
# @return [String]
def error_json(type, description, bandwidth_error_code, bandwidth_error_description)
    return {
        :type => type,
        :description => description,
        :bandwidthErrorCode => bandwidth_error_code,
        :bandwidthErrorDescription => bandwidth_error_description
    }.to_json()
end

# Converts XML to a hash. Taken from
# https://stackoverflow.com/questions/11139709/converting-from-xml-name-values-into-simple-hash
#
# @param xml_string [String] The XML string to convert
# @return [String]
def xml_to_hash(xml_string)
    dom = Nokogiri.XML(xml_string)
    hash = dom.root.element_children.each_with_object(Hash.new) do |e, h|
      h[e.name.to_sym] = e.content
    end

    return hash
end

post '/subscriptions/orders' do
    data = xml_to_hash(request.body.read)
    puts data
    order_id = data[:OrderId]
    phone_number = data[:CompletedTelephoneNumbers]
    phone_numbers.add_phone_number(phone_number, order_id)
    puts "Phone number " + phone_number + " added"
    return "success"
end

post '/subscriptions/disconnects' do
    data = xml_to_hash(request.body.read)
    puts data
    phone_number = data[:CompletedTelephoneNumbers]
    phone_numbers.remove_phone_number(phone_number)
    puts "Phone number " + phone_number + " removed"
    return "success"
end

get '/availablePhoneNumbers' do
    #merge in query params with default quantity and convert strings to symbols for the SDK
    query_params = {:quantity => 10}.merge(params).transform_keys(&:to_sym)

    #check for :areaCode and :zipCode accuracy
    if query_params.has_key?(:areaCode) and not query_params[:areaCode].match(/^\d{3}$/)
        return [400, error_json("validation", "Area code is in an invalid format", "", "")]
    end
    if query_params.has_key?(:zipCode) and not query_params[:zipCode].match(/^\d{5}$/)
        return [400, error_json("validation", "Zip code is in an invalid format", "", "")]
    end

    begin
        phone_numbers_response = BandwidthIris::AvailableNumber.list(query_params)
    rescue Exception => e
        return [400, error_json("validation", e.message, "", "")]
    end

    return [200, phone_numbers_response.to_json()]
end

post '/phoneNumbers' do
    phone_number = JSON.parse(request.body.read)["phoneNumber"]

    #sanity check on phone number format
    if not phone_number.match(/^\d{10}$/)
        return [400, error_json("validation", "Phone number is in an invalid format", "", "")]
    end

    order_data = {
        :name => "Ruby Sample App Order",
        :site_id => SITE_ID,
        :existing_telephone_number_order_type => {
        :telephone_number_list =>
            {
                :telephone_number => [phone_number]
            }

        }
    }

    begin
        order_id = BandwidthIris::Order.create(order_data).id

        return [201, {
            :phoneNumber => phone_number,
            :bandwidthOrderId => order_id
        }.to_json()]
    rescue Exception => e
        return [400, error_json("order-failure", "Order request has failed", "", e.message)]
    end
end

get '/phoneNumbers' do
    return phone_numbers.get_phone_numbers_json()
end

delete '/phoneNumbers/:phoneNumber' do
    if phone_numbers.phone_number_exists(params[:phoneNumber])
        begin
            BandwidthIris::Disconnect.create("Ruby Sample App Disconnect", [params[:phoneNumber]])
            return [201, "received"]
        rescue Exception => e
            return [400, error_json("disconnect-failure", "Disconnect request has failed", "", e.message)]
        end
    else
        return [404, error_json("number-not-found", "Phone number not found", "", "")]
    end
end

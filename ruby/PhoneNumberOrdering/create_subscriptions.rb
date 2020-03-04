# create_subscriptions.rb
#
# A small script that sets up subscription callbacks for Bandwidth number ordering
#
# @copyright Bandwidth INC
require 'ruby-bandwidth-iris'

begin
    IRIS_ACCOUNT_ID = ENV.fetch("IRIS_ACCOUNT_ID")
    IRIS_USERNAME = ENV.fetch("IRIS_USERNAME")
    IRIS_PASSWORD = ENV.fetch("IRIS_PASSWORD")
    SITE_ID = ENV.fetch("SITE_ID")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

if ARGV.length < 1
    puts "usage: ruby create_subscriptions.rb <base_url>"
    exit(-1)
end

base_url = ARGV[0]
if base_url[-1] != '/' then
    base_url += '/'
end

order_url = base_url + "subscriptions/orders" 
disconnects_url = base_url + "subscriptions/disconnects"

BandwidthIris::Client.global_options = {
    :account_id => IRIS_ACCOUNT_ID,
    :username => IRIS_USERNAME,
    :password => IRIS_PASSWORD,
    :api_endpoint => "https://dashboard.bandwidth.com/api"
}

subscription = {
  :order_type => "orders",
  :callback_subcription => {
    :URL => order_url 
  }
}
BandwidthIris::Subscription.create(subscription)

subscription = {
  :order_type => "disconnects",
  :callback_subcription => {
    :URL => disconnects_url 
  }
}
BandwidthIris::Subscription.create(subscription)

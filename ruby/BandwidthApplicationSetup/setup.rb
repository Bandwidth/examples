# setup.rb
#
# A simple ruby script to setup your Bandwidth account
#
# @copyright Bandwidth INC

require 'ruby-bandwidth-iris'

begin
    BANDWIDTH_ACCOUNT_ID = ENV.fetch("BANDWIDTH_ACCOUNT_ID")
    BANDWIDTH_API_USERNAME = ENV.fetch("BANDWIDTH_API_USERNAME")
    BANDWIDTH_API_PASSWORD = ENV.fetch("BANDWIDTH_API_PASSWORD")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

BandwidthIris::Client.global_options = {
  :account_id => BANDWIDTH_ACCOUNT_ID,
  :username => BANDWIDTH_API_USERNAME,
  :password => BANDWIDTH_API_PASSWORD
}

site_data = {
  :name =>"RubySDKSetup",
  :address => {
    :city => "Raleigh",
    :house_number => "900",
    :state_code =>"NC",
    :street_name => "Main Campus Dr",
    :street_suffix => "DR",
    :zip => "27606",
    :address_type => "Billing"
  }
};
site = BandwidthIris::Site.create(site_data)
site_id = site.id 

puts "Site ID: " + site_id.to_s

sippeer_data = {
  :peer_name => "BandwidthApplicationLocation",
  :is_default_peer => true
}
sippeer = BandwidthIris::SipPeer.create(site_id, sippeer_data)
sippeer_id = sippeer[:peer_id]

puts "SipPeer ID: " + sippeer_id.to_s

messaging_application_data = {
  :app_name => "BandwidthMsgApplication",
  :service_type => "Messaging-V2",
  :msg_callback_url => "https://yourcallback.com"
}
puts "Messaging Application"
puts BandwidthIris::Applications.create_application(messaging_application_data)

voice_application_data = {
  :app_name => "BandwidthVoiceApplication",
  :service_type => "Voice-V2",
  :call_initiated_callback_url => "https://yourcallback.com"
}
puts "Voice Application"
puts BandwidthIris::Applications.create_application(voice_application_data)

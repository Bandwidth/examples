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
  :password => BANDWIDTH_API_PASSWORD,
}

##Create site
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

##Create sippeer under site
sippeer_data = {
  :peer_name => "BandwidthApplicationLocation",
  :is_default_peer => true
}
sippeer = BandwidthIris::SipPeer.create(site_id, sippeer_data)
sippeer_id = sippeer[:peer_id]

puts "SipPeer ID: " + sippeer_id.to_s

##Update sippeer sms settings
sms_feature_settings = {
  :sip_peer_sms_feature_settings => {
    :toll_free => false,
    :short_code => false,
    :protocol => "HTTP",
    :zone_1 => true,
    :zone_2 => false,
    :zone_3 => false,
    :zone_4 => false,
    :zone_5 => false
  },
  :http_settings => {}
}

BandwidthIris::SipPeerProducts.create_sms_feature_settings(site_id, sippeer_id, sms_feature_settings)

##Update sippeer mms settings
data = {
  :mms_settings => {
    :protocol => "HTTP"
  },
  :protocols => {
    :HTTP => {
      :http_settings => {}
    }
  }
}
BandwidthIris::SipPeerProducts.create_mms_feature_settings(site_id, sippeer_id, data)

##Create messaging application
messaging_application_data = {
  :app_name => "BandwidthMsgApplication",
  :service_type => "Messaging-V2",
  :msg_callback_url => "https://yourcallback.com"
}
messaging_application = BandwidthIris::Applications.create_application(messaging_application_data)
messaging_application_id = messaging_application[:application_id]
puts "Messaging Application ID: " + messaging_application_id

##Assign messaging application to sippeer
data = {
  :http_messaging_v2_app_id => messaging_application_id
}
BandwidthIris::SipPeerProducts.update_messaging_application_settings(site_id, sippeer_id, data)

##Create voice application
voice_application_data = {
  :app_name => "BandwidthVoiceApplication",
  :service_type => "Voice-V2",
  :call_initiated_callback_url => "https://yourcallback.com"
}
voice_application = BandwidthIris::Applications.create_application(voice_application_data)
voice_application_id = voice_application[:application_id]
puts "Voice Application ID: " + voice_application_id

##Assign voice application to sippeer
data = {
  :voice_protocol => "HTTP",
  :http_settings => {
    :http_voice_v2_app_id => voice_application_id
  }
}
BandwidthIris::SipPeerProducts.create_origination_settings(site_id, sippeer_id, data)

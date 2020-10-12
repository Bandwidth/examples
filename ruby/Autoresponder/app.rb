require "google/apis/sheets_v4"
require "googleauth"
require "googleauth/stores/file_token_store"
require "fileutils"

require 'sinatra'
require 'bandwidth'
require 'ruby-bandwidth-iris'
include Bandwidth
include Bandwidth::Messaging

## Standard Google Credentials
OOB_URI = "urn:ietf:wg:oauth:2.0:oob".freeze
APPLICATION_NAME = "Google Sheets API Ruby Quickstart".freeze
CREDENTIALS_PATH = "credentials.json".freeze
# The file token.yaml stores the user's access and refresh tokens, and is
# created automatically when the authorization flow completes for the first
# time.
TOKEN_PATH = "token.yaml".freeze
SCOPE = Google::Apis::SheetsV4::AUTH_SPREADSHEETS

## Bandwidth Credentials
begin
    MESSAGING_ACCOUNT_ID = ENV.fetch("MESSAGING_ACCOUNT_ID")
    MESSAGING_API_TOKEN = ENV.fetch("MESSAGING_API_TOKEN")
    MESSAGING_API_SECRET = ENV.fetch("MESSAGING_API_SECRET")
    MESSAGING_APPLICATION_ID = ENV.fetch("MESSAGING_APPLICATION_ID")
    ACCOUNT_USERNAME = ENV.fetch("ACCOUNT_USERNAME")
    ACCOUNT_PASSWORD = ENV.fetch("ACCOUNT_PASSWORD")

    ## Autoresponder Spreadsheet Credentials
    SPREADSHEET_ID = ENV.fetch("SPREADSHEET_ID")
rescue
    puts "Please set the environmental variables defined in the README"
    exit(-1)
end

##
# Ensure valid credentials, either by restoring from the saved credentials
# files or intitiating an OAuth2 authorization. If authorization is required,
# the user's default browser will be launched to approve the request.
#
# @return [Google::Auth::UserRefreshCredentials] OAuth2 credentials
def authorize
  client_id = Google::Auth::ClientId.from_file CREDENTIALS_PATH
  token_store = Google::Auth::Stores::FileTokenStore.new file: TOKEN_PATH
  authorizer = Google::Auth::UserAuthorizer.new client_id, SCOPE, token_store
  user_id = "default"
  credentials = authorizer.get_credentials user_id
  if credentials.nil?
    url = authorizer.get_authorization_url base_url: OOB_URI
    puts "Open the following URL in the browser and enter the " \
         "resulting code after authorization:\n" + url
    code = gets
    credentials = authorizer.get_and_store_credentials_from_code(
      user_id: user_id, code: code, base_url: OOB_URI
    )
  end
  credentials
end

bandwidth_client = Bandwidth::Client.new(
    messaging_basic_auth_user_name: MESSAGING_API_TOKEN,
    messaging_basic_auth_password: MESSAGING_API_SECRET
)

$messaging_client = bandwidth_client.messaging_client.client

bandwidth_iris_client = BandwidthIris::Client.global_options = {
  :account_id => MESSAGING_ACCOUNT_ID,
  :username => ACCOUNT_USERNAME,
  :password => ACCOUNT_PASSWORD
}

##
# Find sub-account (site) of a number
#
# @param number [String]
#
# @return sub-account (site) name [String]
def sub_account_name(number)
    tn = BandwidthIris::Tn.get(number)
    return tn.get_sites()[:name]
end

##
# Find location (sippeer) of a number
#
# @param number [String]
#
# @return location (sippeer) name [String]
def location_name(number)
    tn = BandwidthIris::Tn.get(number)
    return tn.get_sip_peers()[:name]
end

##
# Add sending and receiving number combo to opt out list
#
# @param service [Google::Apis::SheetsV4::SheetsService]
# @param sending_number [String]
# @param receiving_number [String]
#
# @return void
def opt_out(service, sending_number, receiving_number)
    opt_range = "'Opt Out'!A:B"
    opt_value_range_object = Google::Apis::SheetsV4::ValueRange.new(majorDimension: 'ROWS', values: [[sending_number, receiving_number]])
    opt_append = service.append_spreadsheet_value(SPREADSHEET_ID, opt_range, opt_value_range_object, value_input_option: 'RAW')
end

##
# Check if sending and receiving number combo is on the opt out list
#
# @param service [Google::Apis::SheetsV4::SheetsService]
# @param sending_number [String]
# @param receiving_number [String]
#
# @return [Boolean]
def is_opted_out?(service, sending_number, receiving_number)
    opt_range = "'Opt Out'!A:B"
    opt_response = service.get_spreadsheet_values SPREADSHEET_ID, opt_range

    opt_response.values.each do |row|
        if row[0] == sending_number and row[1] == receiving_number
            return true
        end
    end
    return false
end

##
# Remove sending and receiving number combo from opt out list
#
# @param service [Google::Apis::SheetsV4::SheetsService]
# @param sending_number [String]
# @param receiving_number [String]
#
# @return void
def remove_from_opt_out(service, sending_number, receiving_number)
    number_range = "'Opt Out'!A2:B"
    opt_spreadsheet = service.get_spreadsheet_values SPREADSHEET_ID, number_range

    number_vals = opt_spreadsheet.values
    number_vals.delete([sending_number, receiving_number])
    service.clear_values SPREADSHEET_ID, number_range
    number_value_range_object = Google::Apis::SheetsV4::ValueRange.new(values: number_vals)
    number_update = service.update_spreadsheet_value(SPREADSHEET_ID, number_range, number_value_range_object, value_input_option: 'RAW')
end

##
# Find index of a message in the message log sheet
#
# @param message_id [String]
#
# # @return message_index [Integer]
#
# @return void
def find_id(message_id, service)
    message_range = "'Message Log'!A2:A"

    # The message may not yet be stored in the sheet, so this will loop through a few times with a pause after each pass
    count = 1
    while count <= 5
        message_spreadsheet = service.get_spreadsheet_values SPREADSHEET_ID, message_range
        message_vals = message_spreadsheet.values
        message_index = message_vals.index([message_id])

        if !message_index.nil?
            return message_index
        end
        sleep(1)
        count = count + 1
    end
end

##
# Log the HTTP Response of a sent message into the Message Log spreadsheet
#
# @param response [Bandwidth::ApiResponse]
#
# @return void
def log_outbound_response(response, service)
    log_range = "'Message Log'!A2:N"
    log_value_range_object = Google::Apis::SheetsV4::ValueRange.new(majorDimension: 'ROWS', values: [[
        response.data.id,
        response.data.from,
        response.data.to[0],
        response.data.text,
        response.data.segment_count,
        response.data.direction,
        "",
        "",
        "",
        response.data.time,
        "",
        response.data.application_id,
        response.data.tag,
        sub_account_name(response.data.from),
        location_name(response.data.from)
    ]])

    log_append = service.append_spreadsheet_value(SPREADSHEET_ID, log_range, log_value_range_object, value_input_option: 'RAW')
end

##
# Log the information of a message received callback into the Message Log spreadsheet
#
# @param callback [Hash]
#
# @return void
def log_inbound(callback, service)
    log_range = "'Message Log'!A2:N"

    log_value_range_object = Google::Apis::SheetsV4::ValueRange.new(majorDimension: 'ROWS', values: [[
        callback["message"]["id"],
        callback["message"]["from"],
        callback["message"]["to"][0],
        callback["message"]["text"],
        callback["message"]["segmentCount"],
        callback["message"]["direction"],
        callback["type"],
        callback["description"],
        "",
        callback["message"]["time"],
        callback["time"],
        callback["message"]["applicationId"],
        "",
        sub_account_name(callback["message"]["to"][0]),
        location_name(callback["message"]["to"][0])
    ]])
    log_append = service.append_spreadsheet_value(SPREADSHEET_ID, log_range, log_value_range_object, value_input_option: 'RAW')
end

##
# Adds additional information to sent messages that have already been stored in the Message Log spreadsheet
# Uses the message_id to find and update the row in the spreadsheet
#
# @param callback [Hash]
#
# @return void
def log_outbound_callback(callback, service)
    row = find_id(callback["message"]["id"], service) + 2
    type_range = "'Message Log'!G" + row.to_s
    description_range = "'Message Log'!H" + row.to_s
    error_range = "'Message Log'!I" + row.to_s
    completed_range = "'Message Log'!K" + row.to_s

    type_value_range_object = Google::Apis::SheetsV4::ValueRange.new(values: [[callback["type"]]])
    description_value_range_object = Google::Apis::SheetsV4::ValueRange.new(values: [[callback["description"]]])
    error_value_range_object = Google::Apis::SheetsV4::ValueRange.new(values: [[callback["errorCode"]]])
    completed_value_range_object = Google::Apis::SheetsV4::ValueRange.new(values: [[callback["time"]]])

    type_update = service.update_spreadsheet_value(SPREADSHEET_ID, type_range, type_value_range_object, value_input_option: 'RAW')
    description_update = service.update_spreadsheet_value(SPREADSHEET_ID, description_range, description_value_range_object, value_input_option: 'RAW')
    if !callback["errorCode"].nil?
        error_update = service.update_spreadsheet_value(SPREADSHEET_ID, error_range, error_value_range_object, value_input_option: 'RAW')
    end
    completed_update = service.update_spreadsheet_value(SPREADSHEET_ID, completed_range, completed_value_range_object, value_input_option: 'RAW')
end

# Take information from a Bandwidth inbound message callback and responds with
#    a text message with the current date and time.
#
# @param to [list<String>] The list of phone numbers that received the message
# @param from [String] The phone number that sent the text message
#
# @return void
def send_message(to, from, text, service)
    body = MessageRequest.new
    body.application_id = MESSAGING_APPLICATION_ID
    body.to = [to]
    body.from = from
    body.text = text
    begin
        response = $messaging_client.create_message(MESSAGING_ACCOUNT_ID, body: body)
        log_outbound_response(response, service)
    rescue Exception => e
        puts e
    end
end

# Determines if a number is toll-free
#
# @param number [String] A phone number
#
# @return Boolean
def is_toll_free?(number)
    areaCodeFirstDigit = number[2]
    areaCodeSecondDigit = number[3]
    areaCodeThirdDigit = number[4]

    if areaCodeFirstDigit == "8" && areaCodeSecondDigit == areaCodeThirdDigit
        return true
    else
        return false
    end
end

##
# Takes info from an incoming message and maps it to a corresponding action
#
# @param to_number [String]
# @param text [String]
# @param text [String]
#
# Determines if and which message to be sent and if the user should be opted out
#
# @return void
def handle_inbound_sms(to_number, from_number, text, service)
    # Get values from Keyword Spreadsheet
    keyword_range = "Keywords!A2:F"
    keyword_response = service.get_spreadsheet_values SPREADSHEET_ID, keyword_range

    location_name = location_name(to_number)
    opted_out = is_opted_out?(service, to_number, from_number)

    opt_out_tf_keywords = ["stop", "arret"]
    opt_in_tf_keywords = ["unstop", "start", "nonarret"]

    if !opted_out && is_toll_free?(to_number) && opt_out_tf_keywords.include?(text.downcase)
        opt_out(service, to_number, from_number)
        return "Opt Out"
    elsif opted_out && is_toll_free?(to_number) && opt_in_tf_keywords.include?(text.downcase)
        remove_from_opt_out(service, to_number, from_number)
        return "Opt In"
    end

    # "*" is used in the spreadsheet as a replacement for no response, as blank cells won't be returned
    keyword_response.values.each do |row|
        if row[2] == location_name || row[2] == "*"
            if row[3] == to_number || row[3] == "*"
                if row[0].downcase == text.downcase || row[0] == "*"
                    if opted_out && row[5] == "T"
                        remove_from_opt_out(service, to_number, from_number)
                        if !is_toll_free?(to_number) || (is_toll_free?(to_number) && text.downcase != "unstop")
                            send_message(from_number, to_number, row[1], service)
                        end
                        return "Opt In"
                    elsif !opted_out && row[4] == "T"
                        opt_out(service, to_number, from_number)
                        if !is_toll_free?(to_number) || (is_toll_free?(to_number) && text.downcase != "stop")
                            send_message(from_number, to_number, row[1], service)
                        end
                        return "Opt Out"
                    elsif !opted_out && row[5] != "T"
                        send_message(from_number, to_number, row[1], service)
                        return "Send Message"
                    end
                end
            end
        end
    end
end

# A method to handle the Bandwidth messaging callbacks
set :threaded, true
post '/MessageCallback' do
    data = JSON.parse(request.body.read)

    # Initialize the Google API
    service = Google::Apis::SheetsV4::SheetsService.new
    service.client_options.application_name = APPLICATION_NAME
    service.authorization = authorize

    # Creating a thread allows us to respond quickly to the callback/webhook while doing all the processing in the background
    Thread.new do
        if data[0]["type"] == "message-received"
            log_inbound(data[0], service)
            handle_inbound_sms(data[0]["message"]["to"][0], data[0]["message"]["from"], data[0]["message"]["text"], service)
        elsif data[0]["type"] == "message-delivered" || data[0]["type"] == "message-failed"
            log_outbound_callback(data[0], service)
        else
            print(data)
        end
    end
end

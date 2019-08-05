# messaging_app.rb
#
# A simple Sinatra app to demonstrate how to use Bandwidth's Messaging API with callbacks
#
# @author Jacob Mulford
# @copyright Bandwidth INC

require 'sinatra'
require 'bandwidth_messaging'

include BandwidthMessaging

MESSAGING_ACCOUNT_ID = (ENV.has_key?("MESSAGING_ACCOUNT_ID") ? ENV["MESSAGING_ACCOUNT_ID"]: nil)
MESSAGING_API_TOKEN = (ENV.has_key?("MESSAGING_API_TOKEN") ? ENV["MESSAGING_API_TOKEN"]: nil)
MESSAGING_API_SECRET = (ENV.has_key?("MESSAGING_API_SECRET") ? ENV["MESSAGING_API_SECRET"]: nil)
MESSAGING_APPLICATION_ID = (ENV.has_key?("MESSAGING_APPLICATION_ID") ? ENV["MESSAGING_APPLICATION_ID"]: nil)

if [MESSAGING_ACCOUNT_ID, MESSAGING_API_TOKEN, MESSAGING_API_SECRET, MESSAGING_APPLICATION_ID].include?(nil)
    puts "Please set the MESSAGING environmental variables defined in the README"
    exit(-1)
end

##This is the only Bandwidth url needed
BANDWIDTH_MEDIA_BASE_ENDPOINT = "https://messaging.bandwidth.com/api/v2/users/%s/media/" % [MESSAGING_ACCOUNT_ID] 

messaging_client = BandwidthMessagingClient.new(basic_auth_user_name: MESSAGING_API_TOKEN, basic_auth_password: MESSAGING_API_SECRET)

$messaging_controller = messaging_client.client

# Takes a full media url from Bandwidth and extracts the media id
# The full media url looks like https://messaging.bandwidth.com/api/v2/users/123/media/<media_id>
#     where <media_id> can be of format <str>/<int>/<str> or <str>
# Example: https://messaging.bandwidth.com/api/v2/users/123/media/file.png
#          https://messaging.bandwidth.com/api/v2/users/123/media/abc/0/file.png
# @param media_url [String] The full media url
# @returns [String] The media id
def get_media_id(media_url)
    split_url = media_url.split("/")
    #Media urls of the format https://messaging.bandwidth.com/api/v2/users/123/media/file.png
    if split_url[-2] == "media"
        return split_url[-1]
    #Media urls of the format https://messaging.bandwidth.com/api/v2/users/123/media/abc/0/file.png
    else
        #This is required for now due to the SDK parsing out the `/`s
        split_url[-3..-1].join("%2F")
    end
end

# Takes a full media url from Bandwidth and extracts the filename
# @param media_url [String] The full media url
# @returns [String] The media file name
def get_media_filename(media_url)
    return media_url.split("/")[-1]
end

# Takes a list of media urls and downloads the media into the temporary storage
#
# @param media_urls [list<String>] The media urls to downloaded
# @returns [list<String>] The list containing the filenames of the downloaded media files
def download_media_from_bandwidth(media_urls)
    downloaded_media_files = []
    media_urls.each do |media_url|
        media_id = get_media_id(media_url)
        filename = get_media_filename(media_url)
        f = File.open(filename, "wb")
        begin
            downloaded_media = $messaging_controller.get_media(MESSAGING_ACCOUNT_ID, media_id)
            f.puts(downloaded_media)
        rescue Exception => e
            puts e
        end
        f.close()
        downloaded_media_files.push(filename)
    end
    return downloaded_media_files
end

# Takes a list of media files and uploads them to Bandwidth
# The media file names are used as the media id
# @param media_files [list<String>] The media files to upload
# @returns void
def upload_media_to_bandwidth(media_files)
    media_files.each do |filename|
        f = File.open(filename, "r")
        file_content = f.read
        begin
            $messaging_controller.upload_media(MESSAGING_ACCOUNT_ID, filename, file_content.length.to_s, file_content, "text/plain", "no-cache")
        rescue Exception => e
            puts "upload error"
            puts e
        end
        f.close()
    end
end

# Removes all of the given files
# @param files [list<String>] The list of files to remove
# @returns void
def remove_files(files)
    files.each do |file|
        File.delete(file)
    end
end

# Takes information from a Bandwidth inbound message callback and initiates a call.
#
# @param to [list<String>] The list of phone numbers that received the message 
# @param from [String] The number that received the message
# @return void 
def handle_inbound_sms_call_me(to, from)
    puts to
    puts from
end

# Take information from a Bandwidth inbound message callback and responds with
#    a text message with the current date and time.
#
# @param to [list<String>] The list of phone numbers that received the message
# @param from [String] The phone number that sent the text message
# @return void
def handle_inbound_sms(to, from)
    body = MessageRequest.new
    body.application_id = MESSAGING_APPLICATION_ID
    body.to = [from]
    body.from = to
    body.text = "The current date-time is: " + Time.now.to_f.to_s + " milliseconds since the epoch"
    begin
        $messaging_controller.create_message(MESSAGING_ACCOUNT_ID, body)
    rescue Exception => e
        puts e
    end
end

# Takes information from a Bandwidth inbound message callback that includes media
#    and responds with a text message containing the same media
#    sent through Bandwidth's media resource.
# @param to [list<String>] The list of phone numbers that received the message
# @param from [String] The phone number that sent the message
# @param media [list<String>] The list of media sent in the message
# @return void
def handle_inbound_media_mms(to, from, media)
    downloaded_media_files = download_media_from_bandwidth(media)
    upload_media_to_bandwidth(downloaded_media_files)
    remove_files(downloaded_media_files)
    body = MessageRequest.new
    body.application_id = MESSAGING_APPLICATION_ID
    body.to = [from]
    body.from = to
    body.text = "Rebound!"
    #Build the media URL by taking the media ids (that doubled as the file names) and appending them to
    #the bandwidth media base url
    body.media = []
    downloaded_media_files.each do |media_file|
        body.media.push(BANDWIDTH_MEDIA_BASE_ENDPOINT + media_file)
    end

    begin
        $messaging_controller.create_message(MESSAGING_ACCOUNT_ID, body)
    rescue Exception => e
        puts e
    end
end

post '/MessageCallback' do
    # A method for showing how to handle Bandwidth messaging callbacks.
    # For inbound SMS that contains the phrase "call me", a phone call is made and the user is asked to
    #    forward the call to another number
    # For inbound SMS that doesn't contain the phrase "call me", the response is a SMS with the date and time.
    # For inbound MMS with a media attachment, the response is the same
    #    media attachment sent through Bandwidth's media resource.
    # For all other events, the callback is logged to console
    data = JSON.parse(request.body.read)

    if data[0]["type"] == "message-received"
        if data[0]["message"]["text"].include?("call me")
            handle_inbound_sms_call_me(data[0]["message"]["to"][0], data[0]["message"]["from"])
        elsif data[0]["message"].include?("media")
            handle_inbound_media_mms(data[0]["message"]["to"][0], data[0]["message"]["from"], data[0]["message"]["media"])
        else
            handle_inbound_sms(data[0]["message"]["to"][0], data[0]["message"]["from"])
        end
    else
        print(data)
    end
    return ""
end

"""
app.py

A simple flask server that handles interactions with Bandwidth's messaging API
"""
from flask import Flask, request
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.models.message_request import MessageRequest

import json

app = Flask(__name__)

bandwidth_client = BandwidthClient(
    messaging_basic_auth_user_name="username",
    messaging_basic_auth_password="password"
)
messaging_client = bandwidth_client.messaging_client.client

account_id = "id"

@app.route('/outboundMessage', methods=['POST'])
def handle_outbound_message():
    """
    Make a POST request to this URL to send a text message
    """
    body = MessageRequest()
    body.application_id = "id"
    body.to = ["+1to"]
    body.mfrom = "+1from"
    body.text = "Hello from Bandwidth"

    messaging_client.create_message(account_id, body=body)

    return ''

@app.route('/messageCallback', methods=['POST'])
def handle_message_callback():
    """
    This URL handles callbacks from Bandwidth. All messaging callbacks (inbound and outbound)
    will come to this URL. The message type must be checked to know if it's an inbound or
    outbound message.

    If the inbound message contains media, that media is downloaded
    """
    data = json.loads(request.data)
    if data[0]["type"] == "message-received":
        print("Message received")
        print(data)
        if "media" in data[0]["message"]:
            for media in data[0]["message"]["media"]:
                media_id = media.split("/")[-3:]
                downloaded_media = messaging_client.get_media(account_id, media_id).body
                print(downloaded_media)
    else:
        print(data)

    return ''

@app.route('/mediaManagement', methods=['POST'])
def handle_media():
    """
    Make a POST request to this endpoint to upload a media file to Bandwidth, then download it
    and print its contents
    """
    media = "simple text string"
    media_id = "bandwidth-sample-app"

    messaging_client.upload_media(account_id, media_id, str(len(media)), body=media)

    downloaded_media = messaging_client.get_media(account_id, media_id).body
    print(downloaded_media)

    return ''

@app.route('/outboundMediaMessage', methods=['POST'])
def handle_outbound_media_message():
    """
    Make a post request to this url to send outbound MMS with media
    """
    #Media previously uploaded to bandwidth
    body = MessageRequest()
    body.application_id = "id"
    body.to = ["+1to"]
    body.mfrom = "+1from"
    body.text = "Hello from Bandwidth"
    body.media = ["https://messaging.bandwidth.com/api/v2/users/{}/media/bandwidth-sample-app".format(account_id)]

    messaging_client.create_message(account_id, body=body)

    #Media not on bandwidth
    body = MessageRequest()
    body.application_id = "id"
    body.to = ["+1to"]
    body.mfrom = "+1from"
    body.text = "Hello from Bandwidth"
    body.media = ["https://assets1.ignimgs.com/2019/09/04/super-mario-world---button-fin-1567640652381.jpg"]

    messaging_client.create_message(account_id, body=body)
    return ''

if __name__ == '__main__':
    app.run(host='0.0.0.0')

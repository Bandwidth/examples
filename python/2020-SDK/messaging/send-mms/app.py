"""
app.py

A simple flask server that handles interactions with Bandwidth's messaging API
"""
from flask import Flask, request
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.models.message_request import MessageRequest
from bandwidth.messaging.exceptions.messaging_exception import MessagingException
import requests

import json

app = Flask(__name__)

bandwidth_client = BandwidthClient(
    messaging_basic_auth_user_name="username",
    messaging_basic_auth_password="password"
)
messaging_client = bandwidth_client.messaging_client.client

account_id = "id"
application_id = "id"

@app.route('/messageCallback', methods=['POST'])
def handle_message_callback():
    """
    Handles inbound MMS
    """
    data = json.loads(request.data)
    if data[0]["type"] == "message-received":
        print(data[0]["type"])
        print(data[0]["description"])
        if "media" in data[0]["message"]:
            print("With media")
            for media in data[0]["message"]["media"]:
                media_id = media.split("/")[-1]
                downloaded_media = requests.get(media, auth=('username', 'password')).content
                with open(media_id, "wb") as f:
                    f.write(downloaded_media)
                    print("Media written to {}".format(media_id))
        else:
            print("With no media")
    elif data[0]["type"] == "message-sending":
        print(data[0]["type"])
        print(data[0]["description"])
        print("MMS message is currently being sent")
    elif data[0]["type"] == "message-delivered":
        print(data[0]["type"])
        print(data[0]["description"])
        print("Message has been delivered")
    elif data[0]["type"] == "message-failed":
        print(data[0]["type"])
        print(data[0]["description"])
        print("Messaging delivery failed")

    return ''

@app.route('/outboundMessage', methods=['POST'])
def handle_outbound_message():
    """
    Make a POST request to this URL to send a text message
    """
    data = json.loads(request.data)

    body = MessageRequest()
    body.application_id = application_id
    body.to = [data["to"]]
    body.mfrom = data["from"]
    body.text = data["text"]
    body.media = ["https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg"]

    try:
        messaging_client.create_message(account_id, body=body)
        return json.dumps({
            "success": True
        })
    except MessagingException as e:
        return json.dumps({
            "success": False,
            "error": e.description
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='4567')

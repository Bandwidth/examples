"""
app.py

A simple flask server that handles interactions with Bandwidth's messaging API
"""
from flask import Flask, request
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.models.message_request import MessageRequest
from bandwidth.messaging.exceptions.messaging_exception import MessagingException

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
    Handles inbound SMS
    """
    data = json.loads(request.data)

    if data[0]["type"] == "message-received":
        print(data[0]["type"])
        print(data[0]["description"])
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
    app.run(host='0.0.0.0')

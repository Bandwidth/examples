"""
server.py

A simple Flask server to demonstrate how to use Bandwidth's Voice and Messaging APIs with callbacks

@author Jacob Mulford
@copyright Bandwidth INC
"""

from flask import Flask
from flask import request
from bandwidthmessaging.bandwidthmessaging_client import BandwidthmessagingClient
from bandwidthmessaging.models.message_request import MessageRequest
from bandwidthmessaging.exceptions.bandwidth_exception import BandwidthException
from bandwidthmessaging.exceptions.bandwidth_unauthorized_exception import BandwidthUnauthorizedException
from bandwidthmessaging.exceptions.bandwidth_forbidden_exception import BandwidthForbiddenException
from bandwidthmessaging.exceptions.bandwidth_not_found_exception import BandwidthNotFoundException
from bandwidthmessaging.exceptions.api_exception import APIException

import time

import json

try:
    import os
    ACCOUNT_ID = os.environ["ACCOUNT_ID"]
    API_TOKEN = os.environ["API_TOKEN"]
    API_SECRET = os.environ["API_SECRET"]
    MESSAGING_APPLICATION_ID = os.environ["MESSAGING_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

message_client = BandwidthmessagingClient(API_TOKEN, API_SECRET)
message_client_controller = message_client.client

app = Flask(__name__)


def handle_inbound_media_sms(to, from_, media):
    """
    Takes information from a Bandwidth inbound message callback that includes media
    and responds with a text message containing the same media
    sent through Bandwidth's media resource.

    :param list<str> to: The list of phone numbers that received the message
    :param str from_: The phone number that sent the message
    :param list<str> media: The list of media sent in the message

    :returns: None
    """
    return None

def handle_inbound_sms(to, from_):
    """
    Take information from a Bandwidth inbound message callback and responds with
    a text message with the current date and time

    :param list<str> to: The list of phone numbers that received the message
    :param str from_: The phone number that sent the text message

    :returns: None
    """
    body = MessageRequest()
    body.application_id = MESSAGING_APPLICATION_ID
    body.to = [from_]
    body.mfrom = to
    body.text = "The current date-time is: " + str(time.time() * 1000) + " milliseconds since the epoch"
    try:
        message_client_controller.create_message(ACCOUNT_ID, body)
    except Exception as e:
        print(e)
    return None

@app.route("/MessageCallback", methods = ["POST"])
def handle_inbound_message():
    """
    A method for showing how to handle Bandwidth messaging callbacks.
    For inbound SMS, the response is a SMS with the date and time.
    For inbound MMS with a media attachment, the response is the same
    media attachment sent through Bandwidth's media resource.
    For all other events, the callback is logged to console
    """
    data = json.loads(request.data)

    if data[0]["type"] == "message-received":
        if "media" in data[0]["message"]:
            handle_inbound_media_sms(data[0]["message"]["to"], data[0]["message"]["from"], data[0]["message"]["media"])
        else:
            handle_inbound_sms(data[0]["message"]["to"][0], data[0]["message"]["from"])
    else:
        print(data)
    return ""


if __name__ == '__main__':
    app.run()

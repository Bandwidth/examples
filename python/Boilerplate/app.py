"""
app.py

A template to create Flask apps that utilize Bandwidth's APIs

@copyright Bandwidth INC
"""
from flask import Flask, request
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.models.message_request import MessageRequest
from bandwidth.voice.models.api_create_call_request import ApiCreateCallRequest
from bandwidth.voice.models.api_modify_call_request import ApiModifyCallRequest
from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import *

import os
import json

try:
    MESSAGING_ACCOUNT_ID = os.environ["MESSAGING_ACCOUNT_ID"]
    MESSAGING_API_TOKEN = os.environ["MESSAGING_API_TOKEN"]
    MESSAGING_API_SECRET = os.environ["MESSAGING_API_SECRET"]
    MESSAGING_APPLICATION_ID = os.environ["MESSAGING_APPLICATION_ID"]
    VOICE_ACCOUNT_ID = os.environ["VOICE_ACCOUNT_ID"]
    VOICE_API_USERNAME = os.environ["VOICE_API_USERNAME"]
    VOICE_API_PASSWORD = os.environ["VOICE_API_PASSWORD"]
    VOICE_APPLICATION_ID = os.environ["VOICE_APPLICATION_ID"]
    BASE_URL = os.environ["BASE_URL"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=VOICE_API_USERNAME,
    voice_basic_auth_password=VOICE_API_PASSWORD,
    messaging_basic_auth_user_name=MESSAGING_API_TOKEN,
    messaging_basic_auth_password=MESSAGING_API_SECRET
)
voice_client = bandwidth_client.voice_client.client
messaging_client = bandwidth_client.messaging_client.client

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home_page():
    return "Hello world"

@app.route("/Create/Message", methods=["POST"])
def create_message():
    data = json.loads(request.data)
    return "Send a text message"

@app.route("/Create/Call", methods=["POST"])
def create_call():
    data = json.loads(request.data)
    return "Create a phone call"

@app.route("/Callbacks/Messaging", methods=["POST"])
def handle_messaging_callback():
    data = json.loads(request.data)
    return "Handle messaging callback"

@app.route("/Callbacks/Voice/Outbound", methods=["POST"])
def handle_voice_callback_outbound():
    data = json.loads(request.data)
    return "Handle outbound voice callback"

@app.route("/Callbacks/Voice/Inbound", methods=["POST"])
def handle_voice_callback_inbound():
    data = json.loads(request.data)
    return "Handle inbound voice callback"

@app.route("/Bxml", methods=["POST"])
def handle_bxml():
    data = json.loads(request.data)
    response = Response()
    #Add more verbs here
    return response.to_bxml()

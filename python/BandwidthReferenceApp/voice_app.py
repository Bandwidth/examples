"""
voice_app.py

A simple Flask app to demonstrate how to use Bandwidth's Voice API with callbacks

@author Jacob Mulford
@copyright Bandwidth INC
"""

from flask import Blueprint
from flask import request

from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import SpeakSentence 
from bandwidth.voice.voice_client import VoiceClient
from bandwidth.voice.models.api_create_call_request import ApiCreateCallRequest
from bandwidth.voice.models.answer_method_enum import AnswerMethodEnum
from bandwidth.voice.models.disconnect_method_enum import DisconnectMethodEnum
from bandwidth.exceptions.api_exception import APIException

import time
import random
import json
import string
import os


try:
    VOICE_ACCOUNT_ID = os.environ["VOICE_ACCOUNT_ID"]
    VOICE_API_USERNAME = os.environ["VOICE_API_USERNAME"]
    VOICE_API_PASSWORD = os.environ["VOICE_API_PASSWORD"]
    VOICE_APPLICATION_ID = os.environ["VOICE_APPLICATION_ID"]
except:
    print("Please set the VOICE environmental variables defined in the README")
    exit(-1)

client = BandwidthClient(voice_basic_auth_user_name=VOICE_API_USERNAME, voice_basic_auth_password=VOICE_API_PASSWORD)

voice_calls_controller = client.voice_client.calls

voice_app = Blueprint('voice_app',__name__)


@voice_app.route("/VoiceCallback", methods = ["POST"])
def handle_inbound_message():
    """
    A method for showing how to handle inbound Bandwidth voice callbacks.
    """
    data = json.loads(request.data)

    print(data)

    response = Response()
    speak_sentence = SpeakSentence(
        sentence="Hello world",
        voice="susan",
        locale="en_US",
        gender="female"
    )

    return response.to_xml()

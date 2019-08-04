"""
voice_app.py

A simple Flask app to demonstrate how to use Bandwidth's Voice API with callbacks

@author Jacob Mulford
@copyright Bandwidth INC
"""

from flask import Blueprint
from flask import request

from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import *

from bandwidth.bandwidth_client import BandwidthClient

from bandwidth.voice.voice_client import VoiceClient
from bandwidth.voice.models.api_create_call_request import ApiCreateCallRequest

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
    pause = Pause(3)
    speak_sentence_1 = SpeakSentence(
        sentence="Let's play a game!",
        voice="susan",
        locale="en_US",
        gender="female"
    )
    speak_sentence_2 = SpeakSentence(
        sentence="What is 6 plus 6?",
        voice="susan",
        locale="en_US",
        gender="female"
    )
    redirect = Redirect(
        redirect_url="/StartGather"
    )
    response = Response()
    response.add_verb(pause)
    response.add_verb(speak_sentence_1)
    response.add_verb(pause)
    response.add_verb(speak_sentence_2)
    response.add_verb(redirect)

    return response.to_xml()

@voice_app.route("/StartGather", methods = ["POST"])
def start_gather():
    """
    Callback endpoint that returns BXML for making a gather
    """
    gather = Gather(
        gather_url="/EndGather",
        max_digits=2
    )
    response = Response()
    response.add_verb(gather)

    return response.to_xml()

CORRECT_URL = "https://www.kozco.com/tech/piano2.wav"
INCORRECT_URL = "https://www32.online-convert.com/dl/web2/download-file/c4ec8291-ddd7-4982-b2fb-4dec2f37dcf4/Never%20Gonna%20Give%20You%20Up%20Original.wav"
@voice_app.route("/EndGather", methods = ["POST"])
def end_gather():
    """
    Callback endpoint that expects a gather callback
    """
    data = json.loads(request.data)

    digits = int(data["digits"])

    audio_url = None

    if digits == 12:
        audio_url = CORRECT_URL 
    else:
        audio_url = INCORRECT_URL

    play_audio = PlayAudio(
        url=audio_url
    )
    response = Response()
    response.add_verb(play_audio)

    return response.to_xml()

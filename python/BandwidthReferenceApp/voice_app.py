"""
voice_app.py

A simple Flask app to demonstrate how to use Bandwidth's Voice API with callbacks

@copyright Bandwidth INC
"""

from flask import Blueprint
from flask import request

from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import *
from bandwidth.bandwidth_client import BandwidthClient
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
    BASE_URL = os.environ["BASE_URL"]
except:
    print("Please set the VOICE environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(voice_basic_auth_user_name=VOICE_API_USERNAME, voice_basic_auth_password=VOICE_API_PASSWORD)

voice_client = bandwidth_client.voice_client.client

voice_app = Blueprint('voice_app',__name__)


def handle_call_me(to, from_):
    """
    A method that creates an outbound call and asks for a gather to transfer the call

    :param str to: The phone number that received the message
    :param str from_: The phone number that sent the message

    :returns: None
    """
    body = ApiCreateCallRequest()
    body.to = from_
    body.mfrom = to
    body.answer_url = BASE_URL + "/StartGatherTransfer"
    body.application_id = VOICE_APPLICATION_ID

    try:
        voice_client.create_call(VOICE_ACCOUNT_ID, body)
    except Exception as e:
        print(e)
    return None

@voice_app.route("/StartGatherTransfer", methods = ["POST"])
def start_gather_transfer():
    """
    A method that returns BXML for creating a gather on an outbound call
    """
    speak_sentence = SpeakSentence(
        sentence="Who do you want to transfer this call to? Enter the 10 digit phone number",
        voice="susan",
        locale="en_US",
        gender="female"
    )
    gather = Gather(
        gather_url="/EndGatherTransfer",
        max_digits=10,
        speak_sentence=speak_sentence
    )
    response = Response()
    response.add_verb(gather)  
    return response.to_bxml()

@voice_app.route("/EndGatherTransfer", methods = ["POST"])
def end_gather_transfer():
    """
    A method that receives a Gather callback from Bandwidth and creates a Transfer response
    """
    data = json.loads(request.data)
    phone_number_string = "+1" + data["digits"]
    
    phone_number = PhoneNumber(
        number=phone_number_string
    )
    
    transfer = Transfer(
        transfer_caller_id=data["from"],
        phone_numbers=[phone_number]
    )
    
    response = Response()
    response.add_verb(transfer)
    return response.to_bxml()

@voice_app.route("/VoiceCallback", methods = ["POST"])
def handle_inbound_call():
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
        redirect_url="/StartGatherGame"
    )
    response = Response()
    response.add_verb(pause)
    response.add_verb(speak_sentence_1)
    response.add_verb(pause)
    response.add_verb(speak_sentence_2)
    response.add_verb(redirect)

    return response.to_bxml()

@voice_app.route("/StartGatherGame", methods = ["POST"])
def start_gather_game():
    """
    Callback endpoint that returns BXML for making a gather
    """
    gather = Gather(
        gather_url="/EndGatherGame",
        max_digits=2
    )
    response = Response()
    response.add_verb(gather)

    return response.to_bxml()

CORRECT_URL = "https://www.kozco.com/tech/piano2.wav"
INCORRECT_URL = "https://www32.online-convert.com/dl/web2/download-file/c4ec8291-ddd7-4982-b2fb-4dec2f37dcf4/Never%20Gonna%20Give%20You%20Up%20Original.wav"
@voice_app.route("/EndGatherGame", methods = ["POST"])
def end_gather_game():
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

    return response.to_bxml()

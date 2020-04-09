"""
app.py

A template to create Flask apps that utilize Bandwidth's APIs

@copyright Bandwidth INC
"""

from flask import Flask, request
from bandwidth.messaging.models.bandwidth_callback_message import BandwidthCallbackMessage
from bandwidth.messaging.models.bandwidth_message import BandwidthMessage
from bandwidth.api_helper import APIHelper
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.controllers.api_controller import APIController, ApiResponse
from bandwidth.messaging.messaging_client import MessagingClient
from bandwidth.messaging.models.message_request import MessageRequest
from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import PlayAudio, SpeakSentence, Gather, Hangup

import os
import json

try:
    BANDWIDTH_ACCOUNT_ID = os.environ["BANDWIDTH_ACCOUNT_ID"]
    BANDWIDTH_API_USER = os.environ["BANDWIDTH_API_USER"]
    BANDWIDTH_API_PASSWORD = os.environ["BANDWIDTH_API_PASSWORD"]
    BANDWIDTH_MESSAGING_TOKEN = os.environ["BANDWIDTH_MESSAGING_TOKEN"]
    BANDWIDTH_MESSAGING_SECRET = os.environ["BANDWIDTH_MESSAGING_SECRET"]
    BANDWIDTH_MSG_APPLICATION_ID = os.environ["BANDWIDTH_MESSAGING_APPLICATION_ID"]
    BANDWIDTH_VOICE_APPLICATION_ID = os.environ["BANDWIDTH_VOICE_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=BANDWIDTH_API_USER,
    voice_basic_auth_password=BANDWIDTH_API_PASSWORD,
    messaging_basic_auth_user_name=BANDWIDTH_MESSAGING_TOKEN,
    messaging_basic_auth_password=BANDWIDTH_MESSAGING_SECRET
)

app = Flask(__name__)


@app.route("/", methods=["GET"])
def home_page():
    return "Hello world"


@app.route("/Callbacks/Messaging", methods=["POST"])
def handle_messaging_callback():
    # raw_data = json.loads(request.data).pop()
    raw_data = APIHelper.json_deserialize(request.data).pop()
    messaging_callback: BandwidthCallbackMessage = BandwidthCallbackMessage.from_dictionary(raw_data)
    message: BandwidthMessage = messaging_callback.message
    is_dlr = message.direction.lower().strip() == 'out'
    if is_dlr:
        log_message = 'Callback Received for: MessageId: %s, status: %s'
        print(log_message % (message.id, messaging_callback.description))
        return 'Received Callback'
    owner = message.owner
    to_numbers = message.to.copy()
    to_numbers.remove(owner)
    to_numbers.append(message.mfrom)
    message_request = MessageRequest(application_id=BANDWIDTH_MSG_APPLICATION_ID,
                                     to=to_numbers,
                                     mfrom=owner)
    message_text = message.text.lower().strip()
    is_dog = message_text == 'dog'
    if is_dog:
        message_request.text = '🐶'
        message_request.media =['https://bw-demo.s3.amazonaws.com/dog.jpg']
    else:
        message_request.text = '👋 Hello From bandwidth!'
    messaging_client: APIController = bandwidth_client.messaging_client.client
    api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
    message_response: BandwidthMessage = api_response.body
    log_message = 'Sent message with MessageId: %s'
    print(log_message % message_response.id)
    return "Handle messaging callback"


@app.route("/Callbacks/Voice/Inbound", methods=["POST"])
def handle_voice_callback_inbound():
    sentence = 'Hello, let\'s play a game. What is 9 + 2'
    voice = 'kate'
    speak_sentence = SpeakSentence(sentence, voice)
    gather = Gather(max_digits=2,
                    first_digit_timeout=10,
                    gather_url='/Callbacks/Voice/Gather',
                    speak_sentence=speak_sentence)
    response = Response()
    response.add_verb(gather)
    bxml = response.to_bxml()
    print(bxml)
    return bxml


@app.route("/Callbacks/Voice/Gather", methods=["POST"])
def handle_voice_callback_gather():
    data = json.loads(request.data)
    digits = data['digits']
    success_file = 'https://bw-demo.s3.amazonaws.com/tada.wav'
    fail_file = 'https://bw-demo.s3.amazonaws.com/fail.wav'
    audio_uri = success_file if digits == '11' else fail_file
    play_audio = PlayAudio(url=audio_uri)
    hangup = Hangup()
    response = Response()
    response.add_verb(play_audio)
    response.add_verb(hangup)
    bxml = response.to_bxml()
    print(bxml)
    return bxml


if __name__ == '__main__':
    app.run()


"""
voice_app.py
A simple Flask app to demonstrate how to use Bandwidth's Bridging functionality
@copyright Bandwidth INC
"""

import json
import os

from flask import Blueprint
from flask import request
from flask import Response
from urllib.parse import urljoin

from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import *
from bandwidth.voice.models.api_create_call_request import ApiCreateCallRequest
from bandwidth.voice.models.api_modify_call_request import ApiModifyCallRequest
from bandwidth.voice.exceptions.api_error_response_exception import ApiErrorResponseException


try:
    BANDWIDTH_ACCOUNT_ID = os.environ["BANDWIDTH_ACCOUNT_ID"]
    BANDWIDTH_API_USER = os.environ["BANDWIDTH_API_USER"]
    BANDWIDTH_API_PASSWORD = os.environ["BANDWIDTH_API_PASSWORD"]
    BANDWIDTH_VOICE_APPLICATION_ID = os.environ["BANDWIDTH_VOICE_APPLICATION_ID"]
    PERSONAL_NUMBER = os.environ["PERSONAL_NUMBER"]
    BASE_URL = os.environ["BASE_URL"]
    PORT = os.environ["PORT"]
except KeyError:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(voice_basic_auth_user_name=BANDWIDTH_API_USER,
                                   voice_basic_auth_password=BANDWIDTH_API_PASSWORD)

voice_client = bandwidth_client.voice_client.client

voice_routes = Blueprint('voice_routes', __name__)


def createOutboundCall(to, mfrom, callId):
    """
    Create the outbound call
    """
    body = ApiCreateCallRequest()
    body.mfrom = mfrom
    body.to = to
    body.application_id = BANDWIDTH_VOICE_APPLICATION_ID
    body.answer_url = urljoin(BASE_URL, '/Outbound/Answer')
    body.tag = callId    # Here we will store the tag from the inbound call to make it available to us later in our bridging method
    body.disconnect_url = urljoin(BASE_URL, '/Disconnect')
    body.disconnect_method = 'POST'
    print('Creating Outbound Call')

    try:
        response = voice_client.create_call(BANDWIDTH_ACCOUNT_ID, body=body)
    except ApiErrorResponseException as e:
        print(e.description) #Invalid from: must be an E164 telephone number
        print(e.response_code) #400
    return response.body.call_id


def updateCall(callId):
    """
    Update the original inbound call to redirect to /UpdateCall
    """
    body = ApiModifyCallRequest()
    body.redirect_url = urljoin(BASE_URL, '/UpdateCall')
    body.state = "active"

    try:
        response = voice_client.modify_call(BANDWIDTH_ACCOUNT_ID, callId, body)
    except Exception as e:
        print(e)
    return response


@voice_routes.route('/')
@voice_routes.route('/Inbound/VoiceCallback', methods = ["POST"])
def handleInboundCallback():
    """
    Handle the inbound call (A-Leg)

    Returns ringing bxml and creates the outbound call (B-leg)
    """
    data = json.loads(request.data)
    createOutboundCall(to=PERSONAL_NUMBER, mfrom=data['from'], callId=data['callId'])

    response = Response()
    speak_sentence = SpeakSentence(
        sentence="Connecting your call, please wait.",
        voice="julie"
    )

    ring = Ring(duration=30)
    redirect = Redirect(redirect_url=urljoin(BASE_URL, '/UpdateCall'))
    response.add_verb(speak_sentence)
    response.add_verb(ring)
    response.add_verb(redirect)
    return response.to_bxml()


@voice_routes.route('/Outbound/Answer', methods = ["POST"])
def handleOutboundAnswer():
    """
    Perform a gather on the outbound call (B-leg) to determine if they want to accept or reject the incoming call
    """
    data = json.loads(request.data)
    if data['eventType'] != 'answer':
        updateCall(data['tag'])
    else:
        response = Response()
        speak_sentence = SpeakSentence(
            sentence="Please press 1 to accept the call or any other button to send to voicemail",
            voice="julie"
        )
        gather = Gather(
            gather_url=urljoin(BASE_URL, '/Outbound/Gather'),
            terminating_digits="#",
            max_digits=1,
            first_digit_timeout=10,
            speak_sentence=speak_sentence,
            tag=data['tag']
        )
        response.add_verb(gather)
        return response.to_bxml()


@voice_routes.route('/Outbound/Gather', methods = ["POST"])
def handleGather():
    """
    Process the result of the gather event and either bridge the calls, or update the A-leg
    """
    data = json.loads(request.data)
    if data['digits'] == '1':
        response = Response()
        speak_sentence = SpeakSentence(
            sentence="The bridge will start now",
            voice='julie'
        )
        bridge = Bridge(data['tag'])
        response.add_verb(speak_sentence)
        response.add_verb(bridge)
        return response.to_bxml()
    else:
        updateCall(data['tag'])
        return ''


@voice_routes.route('/Disconnect', methods = ["POST"])
def handleDisconnect():
    """
    Handle any disconnect events related to the B-leg and update the A-leg accordingly
    """
    data = json.loads(request.data)
    if data['eventType'] == 'timeout':
        updateCall(data['tag'])
    return ('', 204)


@voice_routes.route('/UpdateCall', methods = ["POST"])
def updateCallRoute():
    """
    In the event of a timeout or call screen, update the A-leg call with record bxml to capture a voicemail
    """
    data = json.loads(request.data)
    response = Response()
    speak_sentence = SpeakSentence(
        sentence="The person you are trying to reach is not available, please leave a message at the tone",
        voice='julie'
    )
    play_audio = PlayAudio(url="https://www.soundjay.com/button/sounds/beep-01a.wav")
    record = Record(
        recording_available_url=urljoin(BASE_URL, '/Recording'),
        recording_available_method='POST',
        max_duration=30
    )
    response.add_verb(speak_sentence)
    response.add_verb(play_audio)
    response.add_verb(record)
    return response.to_bxml()


@voice_routes.route('/Recording', methods = ["POST"])
def downloadRecording():
    """
    Trigger the download of the recorded voicemail upon completion callback from bandwidth
    """
    data = json.loads(request.data)
    with(open('./Recordings/' + str(data['recordingId']) + '.wav', "wb")) as f:
        response = voice_client.get_stream_recording_media(BANDWIDTH_ACCOUNT_ID, data['callId'], data['recordingId'])
        f.write(response.body)
    return ('', 204)


@voice_routes.route('/Status', methods = ["POST"])
def returnStatus():
    """
    Capture call status
    """
    data = json.loads(request.data)
    print('Call State:', data['state'])
    return ('', 204)

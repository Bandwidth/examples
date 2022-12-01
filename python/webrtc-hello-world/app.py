"""
app.py

A simple WebRTC Call control server that shows the basics of
 getting a call up and running between a browser and an outbound PSTN call

@copyright Bandwidth INC
"""

import sys
import json
import os
import jwt
import configparser
from flask import Flask, request, send_from_directory, Response
from bandwidth.messaging.models.bandwidth_callback_message import BandwidthCallbackMessage
from bandwidth.messaging.models.bandwidth_message import BandwidthMessage
from bandwidth.api_helper import APIHelper
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.controllers.api_controller import APIController, ApiResponse
from bandwidth.messaging.messaging_client import MessagingClient
from bandwidth.messaging.models.message_request import MessageRequest
from bandwidth.voice.bxml.verbs import PlayAudio, SpeakSentence, Gather, Hangup
from bandwidth.webrtc.web_rtc_client import WebRtcClient
from bandwidth.webrtc.utils.transfer_util import generate_transfer_bxml
from bandwidth.exceptions.api_exception import APIException

config = configparser.ConfigParser()
config.read('config.ini')
try:
    config['bandwidth']['api_user']
    config['bandwidth']['api_password']
except error:
    print("Please set the config variables defined in the README", error)
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=config['bandwidth']['api_user'],
    voice_basic_auth_password=config['bandwidth']['api_password'],
    web_rtc_basic_auth_user_name=config['bandwidth']['api_user'],
    web_rtc_basic_auth_password=config['bandwidth']['api_password'],
)

app = Flask(__name__)
# track our session ID and phone call Id
#  - if not a demo, these would be stored in persistant storage
sessionId = False
# this needs to be saved from PSTN create_participant until the transfer to WebRTC
#  we will also store the token and pstn call_id within this object
pstnParticipant = False


@app.route("/", methods=["GET"])
def home_page():
    return download_file("index.html")


@app.route("/startBrowserCall", methods=["GET"])
def start_browser_call():
    '''
    Coordinates the steps needed to get a Browser participant online
    1. Create the session
    2. Create the participant
    3. Add the participant to the session
    4. Return the token to the browser so they can use it to connect
    '''
    print("start_browser_call> setting up browser for call",
          config['bandwidth']['account_id'], config['bandwidth']['api_user'], config['bandwidth']['api_password'])
    # Get/create a session
    session_id = get_session_id(
        config['bandwidth']['account_id'], "test-session")
    if session_id is None:
        return json.dumps({"message": "failed to create session id"})
    print("start_browser_call> created new session, Id: %s" % session_id)

    # Create a participant
    participant = create_participant(
        config['bandwidth']['account_id'], "browser-bloke")

    # Add that participant to our session
    add_participant_to_session(config['bandwidth']['account_id'],
                               session_id, participant.id)

    res = {"token": participant.token}
    return json.dumps(res)


@app.route("/startPSTNCall", methods=["GET"])
def start_pstn_call():
    '''
    Similar to start_browser_call, except we are using the session we created previously
    '''
    print("start_pstn_call> setting up PSTN call")
    global pstnParticipant
    session_id = get_session_id(
        config['bandwidth']['account_id'], "test-session")
    if session_id is None:
        return json.dumps({"message": "didn't find session Id"})

    pstnParticipant = create_participant(
        config['bandwidth']['account_id'], "PSTN pal")

    add_participant_to_session(config['bandwidth']['account_id'],
                               session_id, pstnParticipant.id)

    pstnParticipant.call_id = initiate_call_to_pstn(
        config['bandwidth']['account_id'], config['outbound_call']['from_number'], config['outbound_call']['dial_number'])

    res = {"status": "ringing"}
    return json.dumps(res)


@app.route("/Callbacks/answer", methods=["POST", "GET"])
def voice_callback():
    '''
    Transfer this pstn call to a WebRTC session
    This is invoked by a callback from BAND when the caller answers the phone.
    This URL was specified as our 'answerUrl' in initiate_call_to_pstn()
    The session it should join was specified when we called add_participant_to_session()
    '''
    global pstnParticipant
    print("voice_callback>Received answer callback")
    bxml = generate_transfer_bxml(pstnParticipant.token).strip()
    print(f"generated transfer {bxml}")
    return Response(bxml, content_type='text/xml')


@app.route("/endPSTNCall", methods=["GET"])
def end_pstn_call():
    '''
    End the PSTN call
    '''
    global pstnParticipant
    print("end_pstn_call> hangup up on PSTN call")
    end_call_to_pstn(config['bandwidth']['account_id'],
                     pstnParticipant.call_id)
    res = {"status": "hungup"}
    return json.dumps(res)


#  ------------------------------------------------------------------------------------------
#  All the functions for interacting with Bandwidth WebRTC services below here
#


def save_session_id(session_id):
    '''
    Save the session id so we can reference it on subsequent calls
    :param string session_id
    '''
    # saved globally for simplicity of demo
    global sessionId
    sessionId = session_id


def get_session_id(account_id, tag):
    '''
    Return the sessionId if it has already been created,
    create a new one, if one doesn't already exist
    Store the session Id in the global sessionId variabe (this is a stand in for persistent storage)
    :param account_id
    :param tag a tag to apply to this session
    :return: the session id
    :rtype: string
    '''
    global sessionId
    if(sessionId != False):
        return sessionId

    # No pre-existing session, create a new on
    body = {
        "tag": tag
    }
    try:
        print(
            f"Calling out to createSession for account#{account_id} with body: {json.dumps(body)} ")
        webrtc_client: APIController = bandwidth_client.web_rtc_client.client
        api_response: ApiResponse = webrtc_client.create_session(
            account_id, body)

        save_session_id(api_response.body.id)
        return api_response.body.id
    except APIException as e:
        print("get_session_id> Failed to create a session: %s" % e.response.text)
        return None


def create_participant(account_id, tag):
    '''
    Create a new participant
    :param account_id
    :param tag to tag the participant with, no PII should be placed here
    :return a participant json object, which contains the token
    '''
    body = {
        "tag": tag,
        "publishPermissions": ["AUDIO"],
    }
    try:
        webrtc_client: APIController = bandwidth_client.web_rtc_client.client
        api_response: ApiResponse = webrtc_client.create_participant(
            account_id, body)

        participant = api_response.body.participant
        participant.token = api_response.body.token
        return participant

    except APIException as e:
        print("create_participant> Failed to create a participant: %s" %
              e.response.text)
        return None


def add_participant_to_session(account_id, session_id, participant_id):
    '''
    Add a newly created participant to a session
    :param account_id
    :param session_id
    :param participant_id
    :return none
    '''
    body = {
        "sessionId": session_id
    }
    try:
        webrtc_client: APIController = bandwidth_client.web_rtc_client.client
        api_response: ApiResponse = webrtc_client.add_participant_to_session(
            account_id, session_id, participant_id, body)

        return None

    except APIException as e:
        print("add_participant_to_session> Failed to add participant to session: %s" %
              e.response.text)
        return None


def initiate_call_to_pstn(account_id, from_number, to_number):
    '''
    Start a call to the PSTN using our Voice APIs
    :param account_id
    :param from_number the number that shows up in the "caller id"
    :param to_number the number you want to call out to
    '''
    voice_client: APIController = bandwidth_client.voice_client.client
    # Create phone call
    body = {
        "from": from_number,
        "to": to_number,
        "applicationId": config['bandwidth']['voice_application_id'],
        "answerUrl": config['server']['base_callback_url'] + "Callbacks/answer",
        "callTimeout": 30
    }

    try:
        response = voice_client.create_call(account_id, body=body)
        return response.body.call_id
    except APIException as e:
        print(
            f"initiate_call_to_pstn> Failed to call out [{e.response_code}] {e.description} ")


def end_call_to_pstn(account_id, call_id):
    '''
    End the call to the PSTN using our Voice APIs
    :param account_id
    :param call_id
    '''
    voice_client: APIController = bandwidth_client.voice_client.client
    body = {
        "state": "completed"
    }
    try:
        response = voice_client.modify_call(account_id, call_id, body=body)
        return None
    except APIException as e:
        print(
            f"end_call_to_pstn> Failed to end call [{e.response_code}] {e.description} ")


@app.route('/public/<path:filename>')
def download_file(filename):
    '''
    Serve static files
    '''
    print("file request for:" + filename)
    return send_from_directory('public', filename)


if __name__ == '__main__':
    app.run(debug=True)

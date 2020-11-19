"""
app.py

A simple app that demonstrates using Bandwidth's create call API and Gather BXML
"""

from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.voice.models.api_create_call_request import ApiCreateCallRequest
from bandwidth.voice.exceptions.api_error_response_exception import ApiErrorResponseException
from bandwidth.voice.bxml.response import Response
from bandwidth.voice.bxml.verbs import SpeakSentence, Gather

from flask import Flask, request

import json
import os

try:
    ACCOUNT_ID = os.environ["ACCOUNT_ID"]
    API_USERNAME = os.environ["API_USERNAME"]
    API_PASSWORD = os.environ["API_PASSWORD"]
    VOICE_APPLICATION_ID = os.environ["VOICE_APPLICATION_ID"]
    BASE_URL = os.environ["BASE_URL"]
except:
    print("Please set the following environmental variables:\nACCOUNT_ID\nAPI_USERNAME\nAPI_PASSWORD\nVOICE_APPLICATION_ID\nBASE_URL")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=API_USERNAME,
    voice_basic_auth_password=API_PASSWORD
)
voice_client = bandwidth_client.voice_client.client

app = Flask(__name__)

@app.route('/outboundCall', methods=['POST'])
def outbound_call():
    data = json.loads(request.data)
    body = ApiCreateCallRequest()
    body.mfrom = data['from']
    body.to = data['to']
    body.application_id = VOICE_APPLICATION_ID
    body.answer_url = BASE_URL + '/voiceCallback'

    try:
        result = voice_client.create_call(ACCOUNT_ID, body=body)
        response = {
            'success': True
        }
        return json.dumps(response), 200
    except ApiErrorResponseException as e:
        response = {
            'success': False,
            'error': e.description
        }
        return json.dumps(response), 400

@app.route('/voiceCallback', methods=['POST'])
def voice_callback():
    data = json.loads(request.data)
    response = Response()
    if data['eventType'] == 'answer':
        speak_sentence = SpeakSentence(
            sentence='Hit 1 for option 1. Hit 2 for option 2. Then hit #'
        )
        gather = Gather(
            gather_url='/gatherCallback',
            terminating_digits='#',
            repeat_count=3,
            speak_sentence=speak_sentence
        )
        response.add_verb(gather)
    elif data['eventType'] == 'disconnect':
        print("Disconnect event received. Call ended")
        return "Ok", 200
    else:
        speak_sentence = SpeakSentence(
            sentence=data['eventType'] + ' event received. Ending call'
        )
        response.add_verb(speak_sentence)

    return response.to_bxml(), 200

@app.route('/gatherCallback', methods=['POST'])
def gather_callback():
    data = json.loads(request.data)
    speak_sentence = None
    response = Response()
    if data['eventType'] == 'gather':
        if data['digits'] == '1':
            speak_sentence = SpeakSentence(
                sentence='You have chosen option 1. Thank you'
            )
        elif data['digits'] == '2':
            speak_sentence = SpeakSentence(
                sentence='You have chosen option 2. Thank you'
            )
        else:
            speak_sentence = SpeakSentence(
                sentence='Invalid option'
            )
    else:
        speak_sentence = SpeakSentence(
            sentence=data['eventType'] + ' event received. Ending call'
        )

    response.add_verb(speak_sentence)
    return response.to_bxml(), 200
    

if __name__ == '__main__':
    app.run()

"""
app.py

Flask app to run the recording sample app

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

@app.route("/VoiceCallbackStatus", methods=["POST"])
def handle_voice_callback_status():
    data = json.loads(request.data)
    #data["tag"] contains the full recording url, if present
    #Format: https://voice.bandwidth.com/api/v2/accounts/123/calls/c-id/recordings/r-id/media
    if "tag" in data.keys():
        call_id = data["tag"].split("/")[-4]
        recording_id = data["tag"].split("/")[-2]
        #Download media from voice API
        media_content = voice_client.get_stream_recording_media(VOICE_ACCOUNT_ID, call_id, recording_id)
        with open("body.wav", "wb") as f:
            f.write(media_content.body)
        media_content = media_content.body

        #Upload media to messaging API
        messaging_client.upload_media(MESSAGING_ACCOUNT_ID, recording_id, str(len(media_content)), body=media_content)
        #Send text
        body = MessageRequest() 
        body.application_id = MESSAGING_APPLICATION_ID
        body.mfrom = data["to"]
        body.to = [data["from"]]
        body.text = "Attached is your recorded message"
        body.media = ["https://messaging.bandwidth.com/api/v2/users/{account_id}/media/{recording_id}".format(account_id=MESSAGING_ACCOUNT_ID, recording_id=recording_id)]
        messaging_client.create_message(MESSAGING_ACCOUNT_ID, body=body)
    return ""

@app.route("/VoiceCallback", methods=["POST"])
def handle_voice_callback():
    ring_audio = PlayAudio(
        url="https://www.soundjay.com/phone/telephone-ring-01a.wav"
    )
    leave_voicemail = SpeakSentence(
        sentence="Please leave a message after the beep. Your time limit is 3 minutes. Press # to stop the recording early"
    )
    redirect = Redirect(
        redirect_url="/RecordCallback"
    )
    response = Response()
    response.add_verb(ring_audio)
    response.add_verb(leave_voicemail)
    response.add_verb(redirect)
    return response.to_bxml()

@app.route("/RecordCallback", methods=["POST"])
def handle_record_callback():
    beep_audio = PlayAudio(
        url="https://www.soundjay.com/button/beep-01a.wav"
    )
    start_recording = Record(
        record_complete_url="/RecordCompleteCallback",
        record_complete_method="POST",
        recording_available_url="/RecordingAvailableCallback",
        recording_available_method="POST",
        max_duration=180,
        terminating_digits="#"
    )
    response = Response()
    response.add_verb(beep_audio)
    response.add_verb(start_recording)
    return response.to_bxml()

@app.route("/RecordCompleteCallback", methods=["POST"])
def handle_record_complete_callback():
    #Loops endlessly until the recording is available
    pause = Pause(
        duration=3
    )
    redirect = Redirect(
        redirect_url="/RecordCompleteCallback"
    )
    response = Response()
    response.add_verb(pause)
    response.add_verb(redirect)
    return response.to_bxml()

@app.route("/RecordingAvailableCallback", methods=["POST"])
def handle_recording_available_callback():
    #The tag attribute is used to pass along the URL of the recording
    data = json.loads(request.data)
    if data["status"] == "complete":
        #Update call to get bxml at "/RecordingGather1" with the recording id as the tag
        body = ApiModifyCallRequest()
        body.redirect_url = BASE_URL + "/RecordingGather1" 
        body.tag = data["mediaUrl"]
        voice_client.modify_call(VOICE_ACCOUNT_ID, data["callId"], body=body)
    return ""

@app.route("/RecordingGather1", methods=["POST"])
def handle_recording_gather_1():
    #Recording URL is in the "tag" of the data
    data = json.loads(request.data)
    ask_to_hear_recording = SpeakSentence(
        sentence="Your recording is now available. If you'd like to hear your recording, press 1, otherwise please hangup"
    )
    gather = Gather(
        first_digit_timeout=15,
        speak_sentence=ask_to_hear_recording,
        max_digits=1,
        gather_url="/EndGather1",
        tag=data["tag"]
    )
    response = Response()
    response.add_verb(gather)
    return response.to_bxml()

@app.route("/EndGather1", methods=["POST"])
def handle_end_gather_1():
    #URL of recording is in the tag
    data = json.loads(request.data)
    response = Response()
    if "digits" in data.keys() and data["digits"] == "1":
        #play recording
        play_recording = PlayAudio(
            url=data["tag"],
            username=VOICE_API_USERNAME,
            password=VOICE_API_PASSWORD
        )
        ask_to_re_record = SpeakSentence(
            sentence="Would you like to re record? Press 1 if so, otherwise please hangup"
        )
        gather = Gather(
            first_digit_timeout=15,
            speak_sentence=ask_to_re_record,
            max_digits=1,
            gather_url="/EndGather2"
        )
        response.add_verb(play_recording)
        response.add_verb(gather)
    else:
        hangup = Hangup()
        response.add_verb(hangup)
    return response.to_bxml()

@app.route("/EndGather2", methods=["POST"])
def handle_end_gather_2():
    data = json.loads(request.data)
    response = Response()
    if "digits" in data.keys() and data["digits"] == "1":
        redirect = Redirect(
            redirect_url="/RecordCallback"
        )
        response.push(redirect)
    else:
        hangup = Hangup()
        response.push(hangup)
    return response.to_bxml()

if __name__ == '__main__':
    app.run()

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
from bandwidthmessaging.exceptions.api_exception import APIException

import time
import random
import json
import string
import os

try:
    ACCOUNT_ID = os.environ["ACCOUNT_ID"]
    API_TOKEN = os.environ["API_TOKEN"]
    API_SECRET = os.environ["API_SECRET"]
    MESSAGING_APPLICATION_ID = os.environ["MESSAGING_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

message_client = BandwidthmessagingClient(API_TOKEN, API_SECRET)
message_client_controller = message_client.client

##This is the only Bandwidth url needed
BANDWIDTH_MEDIA_BASE_ENDPOINT = "https://messaging.bandwidth.com/api/v2/users/{accountId}/media/".format(accountId=ACCOUNT_ID)

app = Flask(__name__)


def get_media_id(media_url):
    """
    Takes a full media url from Bandwidth and extracts the media id

    The full media url looks like https://messaging.bandwidth.com/api/v2/users/123/media/<media_id>
    where <media_id> can be of format <str>/<int>/<str> or <str>

    Example: https://messaging.bandwidth.com/api/v2/users/123/media/file.png
    https://messaging.bandwidth.com/api/v2/users/123/media/abc/0/file.png

    :param str media_url: The full media url

    :returns: str: The media id
    """
    split_url = media_url.split("/")
    #Media urls of the format https://messaging.bandwidth.com/api/v2/users/123/media/file.png
    if split_url[-2] == "media":
        return split_url[-1]
    #Media urls of the format https://messaging.bandwidth.com/api/v2/users/123/media/abc/0/file.png
    else:
        #This is required for now due to the SDK parsing out the `/`s
        return "%2F".join(split_url[-3:])

def get_media_filename(media_url):
    """
    Takes a full media url from Bandwidth and extracts the filename

    :param str media_url: The full media url

    :returns: str: The media file name
    """
    return media_url.split("/")[-1]

def download_media_from_bandwidth(media_urls):
    """
    Takes a list of media urls and downloads the media into the temporary storage

    :param list<str> media_urls: The media urls to downloaded 

    :returns: list<str>: The list containing the filenames of the downloaded media files
    """
    downloaded_media_files = []
    for media_url in media_urls:
        media_id = get_media_id(media_url)
        filename = get_media_filename(media_url)
        with open(filename, "wb") as f:
            try:
                downloaded_media = message_client_controller.get_media(ACCOUNT_ID, media_id)
                f.write(downloaded_media)
            except Exception as e:
                print(e)
        downloaded_media_files.append(filename)
    return downloaded_media_files

def upload_media_to_bandwidth(media_files):
    """
    Takes a list of media files and uploads them to Bandwidth

    The media file names are used as the media id

    :param list<str> media_files: The media files to upload

    :returns: None 
    """
    for filename in media_files:
        with open(filename, "rb") as f:
            file_content = f.read()
            try:
                ##Note: The filename is doubling as the media id##
                response = message_client_controller.upload_media(ACCOUNT_ID, filename, str(len(file_content)), body=file_content)
            except Exception as e:
                print(e)

def remove_files(files):
    """
    Removes all of the given files

    :param list<str> files: The list of files to remove

    :returns: None
    """
    for file_name in files:
        os.remove(file_name)

def handle_inbound_media_mms(to, from_, media):
    """
    Takes information from a Bandwidth inbound message callback that includes media
    and responds with a text message containing the same media
    sent through Bandwidth's media resource.

    :param list<str> to: The list of phone numbers that received the message
    :param str from_: The phone number that sent the message
    :param list<str> media: The list of media sent in the message

    :returns: None
    """
    downloaded_media_files = download_media_from_bandwidth(media)
    upload_media_to_bandwidth(downloaded_media_files)
    remove_files(downloaded_media_files)
    body = MessageRequest()
    body.application_id = MESSAGING_APPLICATION_ID
    body.to = [from_]
    body.mfrom = to
    body.text = "Rebound!"
    #Build the media URL by taking the media ids (that doubled as the file names) and appending them to
    #the bandwidth media base url
    body.media = [BANDWIDTH_MEDIA_BASE_ENDPOINT + media_file for media_file in downloaded_media_files]
    try:
        message_client_controller.create_message(ACCOUNT_ID, body)
    except Exception as e:
        print(e)
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
            handle_inbound_media_mms(data[0]["message"]["to"][0], data[0]["message"]["from"], data[0]["message"]["media"])
        else:
            handle_inbound_sms(data[0]["message"]["to"][0], data[0]["message"]["from"])
    else:
        print(data)
    return ""

if __name__ == '__main__':
    app.run()

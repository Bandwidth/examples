"""
app.py

A simple Flask app to run the messaging and voice apps in this repo

@copyright Bandwidth INC
"""

from flask import Flask
from messaging_app import messaging_app
from voice_app import voice_app

app = Flask(__name__)

app.register_blueprint(messaging_app)
app.register_blueprint(voice_app)

if __name__ == '__main__':
    app.run()

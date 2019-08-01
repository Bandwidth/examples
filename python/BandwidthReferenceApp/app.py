"""
app.py

A simple Flask app to run the messaging and voice apps in this repo

@author Jacob Mulford
@copyright Bandwidth INC
"""

from flask import Flask
from messaging_app import messaging_app

app = Flask(__name__)

app.register_blueprint(messaging_app)

if __name__ == '__main__':
    app.run()

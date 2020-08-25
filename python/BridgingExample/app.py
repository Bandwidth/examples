import os
from flask import Flask
from Voice import voice_app
from Voice.voice_app import voice_routes

app = Flask(__name__)
app.register_blueprint(voice_routes)

if __name__ == '__main__':
    app.run(debug=True, port = voice_app.PORT)

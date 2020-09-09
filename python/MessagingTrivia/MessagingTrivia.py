#!/usr/bin/env python3
"""A text messaging trivia game that gives users questions and adds up points for each one they get one right"""

import os
import random
from datetime import datetime
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from pytrivia import Category, Diffculty, Type, Trivia
from bandwidth.messaging.models.bandwidth_callback_message import BandwidthCallbackMessage
from bandwidth.messaging.models.bandwidth_message import BandwidthMessage
from bandwidth.api_helper import APIHelper
from bandwidth.bandwidth_client import BandwidthClient
from bandwidth.messaging.controllers.api_controller import APIController, ApiResponse
from bandwidth.messaging.models.message_request import MessageRequest

try:
    # Account ID found in your URL on the dashboard (Ex. 1234567)
    BANDWIDTH_ACCOUNT_ID = os.environ["BANDWIDTH_ACCOUNT_ID"]

    # Account credentials to log into the API or UI
    BANDWIDTH_API_USER = os.environ["BANDWIDTH_API_USER"]
    BANDWIDTH_API_PASSWORD = os.environ["BANDWIDTH_API_PASSWORD"]
    # Tokens and secrets are generated through the application page on the dashboard
    BANDWIDTH_MESSAGING_TOKEN = os.environ["BANDWIDTH_MESSAGING_TOKEN"]
    BANDWIDTH_MESSAGING_SECRET = os.environ["BANDWIDTH_MESSAGING_SECRET"]

    # Application ID's created on dashboard (Ex. 123ab-cd4efg5-hijklm67-n8o9pqrst)
    BANDWIDTH_MSG_APPLICATION_ID = os.environ["BANDWIDTH_MESSAGING_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=BANDWIDTH_API_USER,
    voice_basic_auth_password=BANDWIDTH_API_PASSWORD,
    messaging_basic_auth_user_name=BANDWIDTH_MESSAGING_TOKEN,
    messaging_basic_auth_password=BANDWIDTH_MESSAGING_SECRET
)

app = Flask('__main__')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)


class TriviaUser(db.Model):
    """Define our database tables"""
    id = db.Column(db.Integer, primary_key=True)
    phoneNumber = db.Column(db.String(12), unique=True, nullable=False)
    points = db.Column(db.Integer, default=0)
    lives = db.Column(db.Integer, default=5)
    time = db.Column(db.DateTime)
    currentQuestion = db.Column(db.String, default='')
    currentAnswer = db.Column(db.String, default='')
    currentShortAnswer = db.Column(db.String, default='')
    currentDifficulty = db.Column(db.String, default='')
    maxPoints = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"User('{self.phoneNumber}', '{self.points}')"


def determine_new_user(number):
    """Determines if the user is new, if they are, it adds them to the database, and returns a database object"""
    try:
        db_user = TriviaUser.query.filter_by(phoneNumber=number).first()
        if number == db_user.phoneNumber:
            # print('User Exists:', number)
            return db_user
    except:
        new_user = TriviaUser(phoneNumber=number)
        db.session.add(new_user)
        db.session.commit()
        # print('New User Added:', new_user)
        return new_user


def set_trivia_question():
    """Using the PyTrivia API, this function generates a random trivia question and returns a dictionary"""
    my_api = Trivia(True)
    response = my_api.request(1)
    # print(response)
    trivia_dict = response['results']
    results = trivia_dict[0]

    # Print statements for testing
    # print(results)
    # print(results['question'])
    # print(results['correct_answer'])
    return results

# set_trivia_question()


@app.route('/callback/messaging', methods=['POST'])
def handle_callback():

    # Grab the incoming callback information
    raw_data = APIHelper.json_deserialize(request.data).pop()
    messaging_callback: BandwidthCallbackMessage = BandwidthCallbackMessage.from_dictionary(raw_data)
    message: BandwidthMessage = messaging_callback.message

    # Check the direction of the message - if we are receiving a callback saying our outbound message was sent,
    #  we dont want to reply with another generated trivia question
    is_dlr = message.direction.lower().strip() == 'out'
    if is_dlr:
        """Determine if the message is inbound or outbound and handle it"""
        log_message = 'Callback Received for: MessageId: %s, status: %s'
        print(log_message % (message.id, messaging_callback.description))
        return 'Outbound Message'

    question_type = ''
    question_difficulty = ''
    question_category = ''
    question = ''
    question_correct_answer = ''
    question_short_answer = ''
    question_incorrect_answers = ''

    # Parse the trivia question
    trivia_question = set_trivia_question()
    question_type = trivia_question['type']
    question_category = trivia_question['category']
    question = trivia_question['question']
    question_correct_answer = trivia_question['correct_answer']
    question_incorrect_answers = trivia_question['incorrect_answers']
    if trivia_question['difficulty'] == 'easy':
        question_difficulty = 1
    elif trivia_question['difficulty'] == 'medium':
        question_difficulty = 2
    elif trivia_question['difficulty'] == 'hard':
        question_difficulty = 3

    # Grab the message details and determine if user is new or existing, grab corresponding db record
    owner = message.owner
    respondents = message.mfrom
    database_user = determine_new_user(respondents)
    database_user.time = datetime.utcnow()
    # print('Owner', owner)
    # print('Respondents:', respondents)

    message_request = MessageRequest(application_id=BANDWIDTH_MSG_APPLICATION_ID,
                                     to=respondents,
                                     mfrom=owner)

    # Generate a question/answer set for multiple choice and format True/False
    if question_type == 'multiple':
        answers_list = question_incorrect_answers.copy()
        answers_list.append(question_correct_answer)
        random.shuffle(answers_list)
        answers_dict = {'A': answers_list[0], 'B': answers_list[1], 'C': answers_list[2], 'D': answers_list[3]}

        # Match the correct letter answer from the dict key with the correct answer value after randomization
        for key in answers_dict:
            if question_correct_answer == answers_dict[key]:
                question_short_answer = str(key)
            else:
                pass
        question_text = str(question) + ' (' + str(question_difficulty) + ' pts.)' + '\n\n' + \
                        'A. ' + str(answers_list[0]) + '\n' + 'B. ' + str(answers_list[1]) + '\n' + \
                        'C. ' + str(answers_list[2]) + '\n' + 'D. ' + str(answers_list[3])

    elif question_type == 'boolean':
        question_text = 'True or False? (' + str(question_difficulty) + ' pts.)' + '\n\n' + str(question)
        answers_dict = {'T': 'True', 'F': 'False'}
        for key in answers_dict:
            if question_correct_answer == answers_dict[key]:
                question_short_answer = str(key)
            else:
                pass

    # If user is existing, see if they are sending an answer attempt and match it to the correct answer
    #  held in the database
    if message.text.lower().strip() == 'new':
        # If user is requesting a new question, clear their answer field and generate a new question
        database_user.currentQuestion = question
        database_user.currentAnswer = question_correct_answer
        database_user.currentShortAnswer = question_short_answer
        db.session.commit()
        message_request.text = str(question_text) + '\n\n' + 'Total Points: ' + str(database_user.points) + \
                               '\nText \'Help\' for help.\nText \'new\' to generate a new question. ' \
                               '\nText \'delete\' to permanently delete your account. \nThanks for playing Text Trivia!'
        messaging_client: APIController = bandwidth_client.messaging_client.client
        api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
        message_response: BandwidthMessage = api_response.body
        return 'New Question Generated'

    elif message.text.lower().strip() == 'delete':
        # If user is requesting account deletion - delete db info
        TriviaUser.query.filter_by(phoneNumber=respondents).delete()
        db.session.commit()
        message_request.text = str('Account successfully deleted. '
                                   'Simply text us again if you\'d like to make a new one!')
        messaging_client: APIController = bandwidth_client.messaging_client.client
        api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
        message_response: BandwidthMessage = api_response.body
        return 'Account Deleted'

    elif message.text.lower().strip() == 'help':
        # Send a help message with the available message commands
        message_request.text = 'Text \'new\' to receive a new question.\n\nText \'delete\' to permanently delete ' \
                               'your account.\n\nYou can respond to multiple choice questions by either responding ' \
                               'with the corresponding letter choice or texting the full answer.\nTrue/False ' \
                               'questions can be answered by responding with either T, F, True, or False.' \
                               '\n\nCurrent Points: ' + str(database_user.points) + '\nMax Points: ' + \
                               str(database_user.maxPoints) + '\nLives Remaining: ' + str(database_user.lives)
        messaging_client: APIController = bandwidth_client.messaging_client.client
        api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
        message_response: BandwidthMessage = api_response.body
        return 'Help is on the way!'

    elif message.text.lower().strip() == database_user.currentAnswer.lower().strip() or message.text.lower().strip() \
            == database_user.currentShortAnswer.lower().strip():
        answer_confirmation_text = 'Correct!'
        # Award points for giving the correct answer
        database_user.points += int(question_difficulty)
        if database_user.points > database_user.maxPoints:
            database_user.maxPoints = int(database_user.points)

        # set the answer field in the database record to match the newly generated answer
        database_user.currentQuestion = question
        database_user.currentAnswer = question_correct_answer
        database_user.currentShortAnswer = question_short_answer
        db.session.commit()

    else:
        if database_user.currentAnswer == '':
            answer_confirmation_text = 'Welcome to Text Trivia!'
        else:
            answer_confirmation_text = 'Incorrect. The correct answer was ' + \
                                       str(database_user.currentAnswer).strip() + '.'
            database_user.lives -= 1
            if database_user.lives == 0:
                # Reset current point streak if user runs out of lives
                database_user.points = 0
                database_user.lives = 5
                answer_confirmation_text = answer_confirmation_text + '\n\nYou are out of lives! ' \
                                                                      'Your points have been reset.'
        database_user.currentQuestion = question
        database_user.currentAnswer = question_correct_answer
        database_user.currentShortAnswer = question_short_answer
        db.session.commit()

    new_message_text = str(str(answer_confirmation_text) + '\n\n' + str(question_text) + '\n\n\n' +
                           'Total Points: ' + str(database_user.points) + '\nLives: ' + str(database_user.lives) +
                           '\nBest Score: ' + str(database_user.maxPoints) +
                           '\n\nThanks for playing Text Trivia!\nText \'Help\' for help.')

    # Create and send our message using Bandwidht's API
    message_request.text = new_message_text
    messaging_client: APIController = bandwidth_client.messaging_client.client
    api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
    message_response: BandwidthMessage = api_response.body
    return ''


if __name__ == '__main__':
    app.run()

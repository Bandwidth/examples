"""
app.py

A simple 2FA application that shows how to integrate with a login and administrative page
 that are both protected via Two Factor Authentication, with different Scopes

@copyright Bandwidth INC
"""

import sys
import json
import os
import jwt
import configparser
from user import User
from flask import Flask, request, send_from_directory, Response, render_template, redirect, url_for
from bandwidth.bandwidth_client import BandwidthClient
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
    two_factor_auth_basic_auth_user_name=config['bandwidth']['api_user'],
    two_factor_auth_basic_auth_password=config['bandwidth']['api_password'],
)

app = Flask(__name__)

# track our username
#  - if not a demo, these would be stored in persistant storage
user = User("Invalid")
user.security_level = 0


@app.route("/", methods=["GET"])
def show_login_page():
    # show the login page
    # return download_file("login.html")
    return render_template('home_page.html')


@app.route("/appPage", methods=["GET"])
def show_app_page():
    '''
    This should have precautions that only allow access after granting auth, this page will require 'login' scope
    '''
    user = get_user()
    if(user.security_level >= 1):
        # show the main app page
        return render_template('app_page.html', username=user.username)
    else:
        return render_template('error_page.html', username=user.username)


@ app.route("/securePage", methods=["GET"])
def show_secure_page():
    '''
    This should have precautions that only allow access after granting auth, this page will require 'admin' scope
    '''
    user = get_user()
    if(user.security_level >= 2):
        # show the secure app page
        return render_template('secure_page.html', username=user.username)
    else:
        return render_template('error_page.html', username=user.username)


@ app.route("/submitLogin", methods=["POST"])
def validateLogin():
    # validate login info - we would normally do that here, but we aren't in this simple example
    username = request.form['username']
    user = User(username)

    user.delivery_pref = request.form['delivery_preference']

    set_user(user)
    print(f"Username is '{user.username}'")

    # throw up the 2FA login page
    return show_2fa("login")


@ app.route("/goSecure", methods=["GET"])
def goSecure():
    user = get_user()
    print(f"Username '{user.username}' accessing secure site")
    return show_2fa("admin")


def show_2fa(scope):
    '''
    A function that will show a 2FA page for multiple different SCOPEs
    :param the scope to show this for
    '''
    # obtain user info
    user = get_user()
    user.number = config['numbers']['user_number']

    # send out 2FA code
    send2FA(config['bandwidth']['account_id'],
            user, scope)

    # then show 2FA request
    # we'll pass the scope in the html for simplification of the demo, but it should be somewhere non-user accessible
    return render_template('2fa_form.html', user=user.username, scope=scope, message="We just sent you a 2FA code for '" + scope + "', please enter it here")


@ app.route("/2FASubmit", methods=["POST"])
def twofa_submit():
    user = get_user()
    # validate the 2FA code
    code = request.form['code']
    scope = request.form['scope']

    if(validate2FA(config['bandwidth']['account_id'], user.number, scope, code) != True):
        return render_template('2fa_form.html', username=user.username, scope="login", message="Sorry, wrong code, please try again")

    # update their security level
    # proceed on to protected area of the website
    if (scope == "login"):
        user.security_level = 1
        return redirect(url_for('show_app_page'))
    elif(scope == "admin"):
        user.security_level = 2
        return redirect(url_for('show_secure_page'))


@ app.route("/logOut", methods=["GET"])
def log_out():
    user = get_user()
    print(f"Logging out ", user.username)
    user.security_level = 0  # just to be sure
    set_user(User("Invalid"))
    return redirect(url_for('show_login_page'))

#  ------------------------------------------------------------------------------------------
#  All the functions for interacting with Bandwidth WebRTC services below here
#


def set_user(this_user):
    global user
    user = this_user


def get_user():
    '''
    Return the user if it has already been created,
        this should be replaced with your own logic to get the username from a session
    :return: user
    :rtype: object
    '''
    global user
    return user


def send2FA(account_id, user, scope):
    '''
    Send out a 2FA Code
    :param account_id your BAND account id
    :param user who is receiving this code, object has their number and username
    :param scope the scope for this request, e.g. login, secure action, etc
    :return ??
    '''
    # FYI, printing the to_number in prod could violate PII
    print(
        f"For {user.username} sending 2FA to {user.number} from {config['numbers']['from_number']} for Scope '{scope}'")

    if(user.delivery_pref == "sms"):
        application_id = config['bandwidth']['messaging_application_id']
    else:
        application_id = config['bandwidth']['voice_application_id']

    message = user.username + ", your {NAME} {SCOPE} code is {CODE}"
    try:
        body = {
            # mfrom is any number in the location referenced by your Bandwidth Messaging Application
            "from": config['numbers']['from_number'],
            "to": user.number,  # the recipient of the message
            "applicationId": application_id,
            "scope": scope,
            "digits": 6,  # 4-8
            "message": message
        }
        auth_client = bandwidth_client.two_factor_auth_client.client
        if(user.delivery_pref == "sms"):
            auth_client.create_messaging_two_factor(account_id, body)
        else:
            auth_client.create_voice_two_factor(account_id, body)

        return

    except APIException as e:
        print("send2FA> Failed to send 2FA: %s" %
              e.response.text)
        return None


def validate2FA(account_id, to_number, scope, code):
    '''
    Validate the 2FA Code you sent out before
    :param account_id your BAND account id
    :param to_number who is receiving this code
    :param scope the scope for this request, e.g. login, secure action, etc
    :param code The code that was given back to you by the End User
    :return ??
    '''
    # FYI, printing the to_number in prod could violate PII
    print(
        f"verifying 2FA for {to_number} for Scope '{scope}''")
    try:
        body = {
            # Should be the same as your request
            "from": config['numbers']['from_number'],
            "to": to_number,
            "applicationId": config['bandwidth']['messaging_application_id'],
            "scope": scope,
            "code": code,
            "digits": 6,
            "expirationTimeInMinutes": 3
        }
        auth_client = bandwidth_client.two_factor_auth_client.client
        response = auth_client.create_verify_two_factor(account_id, body)

        return response.body.valid

    except APIException as e:
        print("validate2FA> Failed to validate 2FA: %s" %
              e.response.text)
        return None


@ app.route('/public/<path:filename>')
def download_file(filename):
    '''
    Serve static files
    '''
    return send_from_directory('public', filename)


if __name__ == '__main__':
    app.run(debug=True)

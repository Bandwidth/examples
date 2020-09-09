<div align="center">

# Messaging Trivia
</div>

A basic trivia messaging game that leverages Bandwidth's messaging API along with the Python Trivia API, an API that
pulls trivia questions from [OpenTDB](https://opentdb.com/).

## Pre-Requisites
You will need a valid Bandwidth account, application, and location with a valid phone number and callback URL set. We
recommend using an ['ngrok'](https://ngrok.com/) generated URL for local testing.

## Description
This is a small messaging app demonstrating some SMS Messaging capabilities using the Bandwidth API.

### Environmental Variables
The following environmental variables need to be set. For more information about each variable. Read more about each
variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable                              | Description                             | Example                                            |
|:--------------------------------------|:----------------------------------------|:---------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`                | Your Bandwidth Account Id               | `1234567`                                          |
| `BANDWIDTH_API_USER`                  | Your Bandwidth API Username             | `johnDoe`                                          |
| `BANDWIDTH_API_PASSWORD`              | Your Bandwidth API Password             | `correct-horse-battery-stap1e`                     |
| `BANDWIDTH_MESSAGING_TOKEN`           | Your Bandwidth Messaging API token      | `eabb9d360e4025c81e28d336612ff402861a68d8f578307e` |
| `BANDWIDTH_MESSAGING_SECRET`          | Your Bandwidth Messaging API secret     | `70ba9d5e4f6c9739f86eab6e117f148af1ef8093793cbc87` |
| `BANDWIDTH_MESSAGING_APPLICATION_ID ` | Your Bandwidth Messaging application ID | `123ab-cd4efg5-hijklm67-n8o9pqrst`                 |

### Callback URLs For Bandwidth Applications
| Callback Type          | URL                        |
|:-----------------------|:---------------------------|
| Messaging Callback     | `/callbacks/messaging`     |

### Commands
Clone the repo and run the following commands to get started
```
pip install bandwidth-sdk
pip install Python-Trivia-API
python MessagingTrivia.py
```
And in a separate terminal window
```
./ngrok http 5000
```
Be sure to set the callback in your Bandwidth Messaging Application to `(ngrokUrl)/callbacks/messaging`

## What You Can Do
* Text your Bandwidth number associated with the application to start receiving trivia questions
* Send answers back to the Bandwidth number and receive points for answering correctly
* Keep track of users current questions/answers/points/lives with the local database

## Tutorial

### Assumptions

* Have Bandwidth Account with an application and associated phone number set up
* Have Python (3.7.6+) Installed (along with pip)
* Have [ngrok](https://ngrok.com) installed

### Code-along

#### Initialize Bandwidth client

* Check environment variables and define client

```python
try:
    BANDWIDTH_ACCOUNT_ID = os.environ["BANDWIDTH_ACCOUNT_ID"]
    BANDWIDTH_API_USER = os.environ["BANDWIDTH_API_USER"]
    BANDWIDTH_API_PASSWORD = os.environ["BANDWIDTH_API_PASSWORD"]
    BANDWIDTH_MESSAGING_TOKEN = os.environ["BANDWIDTH_MESSAGING_TOKEN"]
    BANDWIDTH_MESSAGING_SECRET = os.environ["BANDWIDTH_MESSAGING_SECRET"]
    BANDWIDTH_MSG_APPLICATION_ID = os.environ["BANDWIDTH_MESSAGING_APPLICATION_ID"]
    BANDWIDTH_VOICE_APPLICATION_ID = os.environ["BANDWIDTH_VOICE_APPLICATION_ID"]
except:
    print("Please set the environmental variables defined in the README")
    exit(-1)

bandwidth_client = BandwidthClient(
    voice_basic_auth_user_name=BANDWIDTH_API_USER,
    voice_basic_auth_password=BANDWIDTH_API_PASSWORD,
    messaging_basic_auth_user_name=BANDWIDTH_MESSAGING_TOKEN,
    messaging_basic_auth_password=BANDWIDTH_MESSAGING_SECRET
)
```

#### Handling message callbacks
* For this guide, we're only actually hitting the Bandwidth API on inbound messages
* Parsing out the callback using the APIHelper tools allows us to grab the important incoming message information

```python
# Deserialize the JSON list we receive at the callback URL provided to Bandwidth
raw_data = APIHelper.json_deserialize(request.data).pop()

# Create a messaging callback object of the JSON data using the Bandwidth SDK
messaging_callback: BandwidthCallbackMessage = BandwidthCallbackMessage.from_dictionary(raw_data)

# Create a message object using the Bandwidth SDK - this is where we will find the content of the text as well as who sent it
message: BandwidthMessage = messaging_callback.message
```

#### Check if DLR

* Bandwidth's messaging API sends both inbound message events and outbound delivery receipts (DLRs) to the same URL
* We need to check the direction of the message to determine actions.
  * For outbound messages, print the status and send a return value to exit our function
  * If we fail to return and exit the function when receiving a DLR, our script will think that every DLR is a new message request from the user and send a new Trivia question each time - sticking us in an infinite loop.

```python
is_dlr = message.direction.lower().strip() == 'out'
if is_dlr:
    log_message = 'Callback Received for: MessageId: %s, status: %s'
    print(log_message % (message.id, messaging_callback.description))
    return 'Received Callback'
```
#### Check the incoming message details

```python
    # our message owner in this use case is our Bandwidth telephone number that our end user is sending messages to
    owner = message.owner

    # message.mfrom is who the incoming message came from - this is where we want to send a new question
    respondents = message.mfrom

    # Check the database to see if this user is new or existing, and
    database_user = determine_new_user(respondents)
    database_user.time = datetime.utcnow()

    # Initialize MessageRequest object - this is what we give back to Bandwidth with our outgoing message details
    message_request = MessageRequest(application_id=BANDWIDTH_MSG_APPLICATION_ID,
                                     to=respondents,
                                     mfrom=owner)
```


#### Check the incoming message content
We need to determine what the user is sending to our Bandwidth number before we can decide on what to send back. The
code snippet below demonstrates just a few of our available options.
```python
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
```
#### Create our outbound message
If the user hasn't requested help or deletion of their account, we want to let them know if their answer was correct or not!
To do so, we need to send them a message back to let them know, as well as give them the new question we generated earlier.

```python
    new_message_text = str(str(answer_confirmation_text) + '\n\n' + str(question_text) + '\n\n\n' +
                           'Total Points: ' + str(database_user.points) + '\nLives: ' + str(database_user.lives) +
                           '\nBest Score: ' + str(database_user.maxPoints) +
                           '\n\nThanks for playing Text Trivia!\nText \'Help\' for help.')

    # Create and send our message using Bandwidth's API
    message_request.text = new_message_text
    messaging_client: APIController = bandwidth_client.messaging_client.client
    api_response: ApiResponse = messaging_client.create_message(BANDWIDTH_ACCOUNT_ID, message_request)
    message_response: BandwidthMessage = api_response.body
    return ''
```

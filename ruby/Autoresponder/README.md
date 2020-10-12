<div align="center">

# Autoresponder Demo

![BW_messaging](https://github.com/Bandwidth/examples/blob/master/.readme_images/BW_Messaging.png)

Combine Bandwidth and Google Sheet's APIs to create an autoresponder with custom keywords, opt out management, and message logging.

</div>

## Pre-Reqs

#### Bandwidth
You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

#### Google Sheets
Follow the instructions [here](https://developers.google.com/sheets/api/quickstart/ruby) to generate a `credentials.json` file. Make sure to save that file in the same directory as your `autoresponder.rb`.

Make a copy of this [spreadsheet](https://docs.google.com/spreadsheets/d/1hQeHCh35xMTLCKuHQJp95RnrTHuQbaEAdbT-CO1Edh0/edit?usp=sharing) and save the spreadsheet ID as an environmental variable. The spreadsheet ID is the value between the "/d/" and the "/edit" in the URL of your spreadsheet.

## Installation

Clone the repo and run `bundle install` to get started

## Usage

The following environmental variables need to be set

| Variable | Description |
|--|--|
| MESSAGING_ACCOUNT_ID | Your Bandwidth Messaging account ID |
| MESSAGING_API_TOKEN | Your Bandwidth Messaging API token |
| MESSAGING_API_SECRET | Your Bandwidth Messaging API secret |
| MESSAGING_APPLICATION_ID | Your Bandwidth Messaging application ID |
| ACCOUNT_USERNAME | Your Bandwidth account username |
| ACCOUNT_PASSWORD | Your Bandwidth account password |
| SPREADSHEET_ID | The ID of the Google Sheets spreadsheet |

## Callback URLs For Bandwidth Applications

| Callback Type | URL |
|--|--|
| Messaging Callback | <url>/MessageCallback |
  
## Creating Keywords

1. Create a keyword and response pair, so that whenever a keyword is received (regardless of capitalization), the response will be sent in return. 
2. Determine if you'd like the keywords to be used for all phone numbers associated with the Application, a specific Location, or a specific phone number. For all phone numbers, enter `*` in both the Location and Phone Number Column. To specify a Location or Phone Number, input the Location Name or Phone Number into the corresponding column and `*` in the other. If you're curious as to why we're using `*` rather than leaving the cells blank, Google Sheets only returns cells that have an input. So, for example, to make sure we know that the 4th cell of a row always corresponds to a specific Phone Number, we have to include some input in all previous cells. 
3. Consider whether or not the keyword should opt out or opt in a user. `T` is used to set the column to true, while `*` can be used otherwise. If an opted in user texts an opt out keyword, they will be sent the response and added to list on the Opt Out tab. Prior to being sent any message, a check is made on the opt out list to make sure the user is able to be sent a message. If an opted out user sends in an opt in keyword, they will be sent the response and removed from list on the Opt Out tab. When using a toll-free number, it's important to note that there are pre-defined opt in/out words that you do not need to account for. For reference, `Stop` and `Arret` are the opt out keywords, while `Unstop`, `Start`, and `Nonarret` are the opt in keywords.

## Run The Server
Run the following command to start the server

```
ruby app.rb
```

You are now ready to text your Bandwidth phone number that is associated with the application

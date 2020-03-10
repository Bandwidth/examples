<div align="center">

# Bandwidth C# Example

![BW_all](../../.readme_images/BW_all.png)

</div>

This is the Bandwidth C# example app.

## Notes
* Modify the `local.props` file with your creadintials.
* The application needs to be accessible to the Bandwidth callbacks. (open to internet)

## functionality

### Messaging
* auto-responds to an incoming text message with a sentence
* auto-responds to an incoming MMS with the same attachment
    * downloads the media to disk and re-uploads to Bandwidth with a new name
    * use the re-uploaded media as the attachment
### Voice
* answers an incoming call
* Speaks sentence saying 'lets play a game'
* Creates a gather asking them a sum of two integers
* after the gather callback
    * checks the sum
    * if they got it right, play a winning media file
    * if they got it wrong, play a diffrent media file
* after file plays end the call
### Voice & Messaging
* If someone texts "call me" in any sort of case or extra spaces before / after
* create a call to them
* Create gather asking for a phone number
* speak sentence asking "hey you asked to call, who should I call for you"
* forward the call to the number they pressed in the gather.

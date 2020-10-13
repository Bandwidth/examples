class User:
    username = None
    security_level = 0
    current_scope = None
    number = None
    delivery_pref = "sms"

    def __init__(self, username):
        self.username = username
        self.security_level = 0

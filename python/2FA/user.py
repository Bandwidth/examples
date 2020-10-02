class User:
    username = None
    security_level = 0
    current_scope = None
    number = None

    def __init__(self, username):
        self.username = username
        print("created user with name ", self.username)

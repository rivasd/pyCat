'''
Created on Feb 9, 2016

@author: User
'''
class SettingException(Exception):
    def __init__(self, msg):
        self.msg = msg
        
class NoAppropriateModel(Exception):
    def __init__(self, msg):
        self.msg = msg
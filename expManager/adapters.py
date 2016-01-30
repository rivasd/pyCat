'''
Created on Jan 29, 2016

@author: Daniel Rivas
'''

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User

class SocialAuthAdapter(DefaultSocialAccountAdapter):
    """
    Provides multiple methods to do stuff when users authenticate or link accounts
    
    Use this to do custom logic on the database at specific moments in the authentication flow
    """
    
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a
        social provider, but before the login is actually processed
        (and before the pre_social_login signal is emitted).
        """
        
        #start by checking if this is a new or returning User
        if User.objects.all().filter(email__exact = sociallogin.user.email).len():
            #this is a returning user
            pass
        
        else:
            pass
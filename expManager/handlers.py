'''
Created on Feb 12, 2016

@author: Daniel Rivas
'''
from django.db.models.signals import post_save
from django.dispatch import receiver
from expManager.models import BaseSubject, Subject
from django.conf import settings
from django.contrib.auth.signals import user_logged_in

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def createSubject(sender, instance, created, **kwargs):
    """
    This ensures that all models inheriting from my provided subject model get created when a new user signs up
    """
    if created:
        # a new user has been created. we should create an instance of every subclass of expManager.BaseSubject
        for usermodel in BaseSubject.__subclasses__(): # @UndefinedVariable
            record = usermodel(user=instance)
            record.save()
    
@receiver(user_logged_in)
def setSubject(sender, request, user, **kwargs):
    myuser = user
    pass 
    
'''
Created on Feb 13, 2016

@author: Daniel Rivas
'''
from expManager.models import Payment, Experiment, Participation, Subject
from django.utils.translation import ugettext as _

class PaymentRefusedException(Exception):
    pass


def createPayment(participation):
    
    if not participation.experiment.compensated:
        raise PaymentRefusedException(_("This experiment does not allow compensation"))
    
    present = Payment.objects.filter(participation=participation).count()
    
    pass
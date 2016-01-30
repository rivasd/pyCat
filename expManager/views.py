from django.shortcuts import render
from django.template import RequestContext
from django.conf import settings
from importlib import import_module
from expManager.models import Experiment

# Create your views here.
def home(request):
    """
    The home page of the web experiments section
    """

    
    available = Experiment.objects.all()
    return render(request, 'homepage.html', RequestContext(request, {'manips': available}))


#helper functions

def check_manips():
    """
    Verify that the Experiments table listing available experiment really matches the current configuration
    """
    
    pass
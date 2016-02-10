from django.shortcuts import render
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from cat_experiment.models import *
from django.http import JsonResponse, Http404


# Create your views here.
def index(request):
    return render(request, 'cat_experiment/categorization.html', RequestContext(request))

@login_required
def launch(request):
    return render(request, 'cat_experiment/experiment.html', RequestContext(request))
    pass

def getExperiment(request):
    if not request.is_ajax:
        # raise Http404
        pass
    
    if not request.user.is_authenticated():
        return JsonResponse({'error': 'login required'})
    
    params = request.POST
    version="test"
    if not params['isTest']:
        version = 'production'
    
    experiment = GeneralSetting.objects.retrieve(version)
    
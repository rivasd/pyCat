from django.shortcuts import render
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from cat_experiment.models import *
from expManager.models import *
from django.http import JsonResponse, Http404


# Create your views here.
def index(request):
    return render(request, 'cat_experiment/categorization.html', RequestContext(request))

@login_required
def launch(request):
    return render(request, 'cat_experiment/experiment.html', RequestContext(request))
    pass

def getExperiment(request):
    # reject requests not made through AJAX
    if not request.is_ajax:
        # raise Http404
        pass
    # Reject non authenticated request. Did not use the decorator to avoid a redirect in an ajax response: We expect valid JSON in any case
    if not request.user.is_authenticated():
        return JsonResponse({'error': 'login required'})
    
    # read from get parameters to infer the name of the setting configuration to return, e.g 'full' or 'test'
    version=request.GET['type']
    settings = GeneralSetting.objects.retrieve(version) # This is what will be returned in the end, we assume all calls need the general settings, which will contain a timeline
    # Get the name of requested experiment (actually the namespace of the include() call, but that should have been set properly in pyCat.urls.py right?)
    experiment_name = request.resolver_match.app_name
    # Find any saved participation of this user to this experiment
    previous = Participation.objects.filter(subject__username=request.user.username, experiment__label=experiment_name)
    
    if previous.exists():
        # This subject has a participation to this experiment, should we allow to redo or continue? code that sh*t later
        return JsonResponse({'error': 'cannot repeat this experiment'})
        pass
    else:
        # no previous participation, so send the whole experiment
        similarity = SimilarityPhaseSetting.objects.retrieve(version)
        categorization = CategorizationPhaseSetting.objects.retrieve(version)
        settings.pushToTimeline(similarity.toDict())
        settings.pushToTimeline(categorization.toDict())
        settings.pushToTimeline(similarity.toDict())
        
        #now that the timeline attribute of the main setting object is filled, convert the setting object to a dict and JSON it away!
        return JsonResponse(settings.toDict())
    
from django.shortcuts import render
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from cat_experiment.models import *
from expManager.models import *
from django.http import JsonResponse, Http404
from django.utils.translation import ugettext as _
from expManager.utils import sort_trials
import datetime


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
        firstBlock = similarity.toDict()
        firstBlock['master'] = True
        settings.pushToTimeline(firstBlock)
        settings.pushToTimeline(categorization.toDict())
        settings.pushToTimeline({'reprise': 0})
        settings_dict = settings.toDict()
        settings_dict['subject'] = request.user.id
        settings_dict['previous'] = False
        #now that the timeline attribute of the main setting object is filled, convert the setting object to a dict and JSON it away!
        return JsonResponse(settings_dict)


def save(request):
    if not request.user.is_authenticated():
        return JsonResponse({'error': _('must be logged in to save data')})
    
    # I think we should start by defining the participation object
    try:
        meta = json.loads(request.POST['meta'])
        data = json.loads(request.POST['data'])
        subject_id = meta['subject']
        previous = meta['previous']
        finished = meta['complete']
        startTime = meta['startTime']
        parameters = meta['parameters']
    except:
        return JsonResponse({'error': _('missing key metadata, could not save.')})
    
    try:
        experiment = Experiment.objects.get(label = request.resolver_match.app_name)
    except:
        return JsonResponse({'error': _('experiment name was not properly calibrated')})
    
    try:
        subject = Subject.objects.get(username=request.user.username)
    except:
        return JsonResponse({'error': _('There is no subject for that id number')})
    
    if previous == False:
        participation = Participation(experiment=experiment, subject = subject, complete=finished, started=startTime, parameters=parameters)
        participation.save()
    else:
        participation = Participation.objects.get(pk=previous)
        
    
    new_run = Run(participation=participation, start_time=startTime, end_time = datetime.datetime.now())
    new_run.save()
    
    trials = sort_trials(data)
    for trial_type, trialBatch in trials:
        
        if trial_type == "categorize":
            model = CategorizationTrial
            
        elif trial_type == 'similarity':
            model = SimilarityTrial
            
        else:
            return JsonResponse({'error': _('We could not handle your trial of type: ')+trial_type})
        
        instances = []
        for trial in trialBatch:
            try:
                trial['run'] = new_run
                instance = model(**trial)
            except:
                return JsonResponse({'error':_('Could not create a trial of type ')+ trial_type+ _(' with this data: ')+ json.dumps(trial)})
                
            instances.append(instance)
        
        # finally we do the INSERTs !
        try:
            model.objects.bulk_create(instances)
        except:
            return JsonResponse({'error': _('Failure to bulk write to database, contact administrator')})
        
        # SUCCESS!! :) <3
        # mark the participation as complete if this run was enough
        participation.complete = True
        participation.save()
        request.session['lastCompleted'] = experiment.label
        
        return JsonResponse({'success': _('Your data has been recorded successfully, thank you very much!')})
        
        
from django.shortcuts import render
from django.template import RequestContext
from django.contrib.auth.decorators import login_required


# Create your views here.
def index(request):
    return render(request, 'cat_experiment/categorization.html', RequestContext(request))

@login_required
def launch(request):
    pass
    
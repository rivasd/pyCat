from django.shortcuts import render
from django.template import RequestContext


# Create your views here.
def index(request):
    return render(request, 'cat_experiment/index.html', RequestContext(request))
    
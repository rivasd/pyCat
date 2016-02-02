from django.contrib import admin
from expManager.models import Experiment, Subject, Participation
 
admin.site.register(Experiment)
admin.site.register(Subject)
admin.site.register(Participation)

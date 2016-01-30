from django.contrib import admin
from expManager.models import Experiment, Subject, Participation
# Register your models here.
admin.site.register(Experiment)
admin.site.register(Subject)
admin.site.register(Participation)

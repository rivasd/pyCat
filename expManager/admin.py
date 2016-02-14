from django.contrib import admin
from expManager.models import Experiment, Subject, Participation, Payment
 
admin.site.register(Experiment)
admin.site.register(Subject)
admin.site.register(Participation)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]
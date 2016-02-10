from django.contrib import admin
from .models import *
 
 
admin.site.register(Block)
admin.site.register(Trial)
admin.site.register(MicroComponentPair)
admin.site.register(GeneralSetting)
admin.site.register(SimilarityPhaseSetting)
admin.site.register(CategorizationPhaseSetting)
admin.site.register(Category)
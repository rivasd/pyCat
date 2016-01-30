from django.conf.urls import url
from . import views
from django.apps import apps



app_name = 'categorization'
urlpatterns = [
    url(r'^$', views.index, name='home'),
    url(r'^launch$', views.launch, name='launch'),
]

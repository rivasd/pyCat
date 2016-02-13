from django.conf.urls import url
from . import views

app_name = 'categorization'
urlpatterns = [
    url(r'^$', views.index, name='home'),
    url(r'^launch$', views.launch, name='launch'),
    url(r'^load$', views.getExperiment, name='load'),
    url(r'^save$', views.save, name="save")
]

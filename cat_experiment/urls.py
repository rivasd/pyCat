from django.conf.urls import url
from . import views
from django.apps import apps




urlpatterns = [
    url(r'^$', views.index, name="categorization"),
]

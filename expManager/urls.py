from django.conf.urls import include, url
from . import views

urlpatterns = [
    url(r'^$', views.home, name='homepage'),
    url(r'^claim/(?P<code>[1-9]\d*)$', views.claim, name='claim')
]

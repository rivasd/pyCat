"""pyCat URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
import allauth.urls
import expManager.urls
from django.conf import settings
from django.apps import apps, AppConfig

urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/', include(allauth.urls)),
    url(r'^', include(expManager.urls))
]

#we dynamically add one url entry per app in settings.LOCAL_SETTINGS
#NOTE THAT THE URL IS BUILT WITH THE 'label' PROPERTY of the applications' AppConfig. this is because i screwed up and used ugly names for this app :(
#make sure each experiment has an appconfig configured, thus a default_app_config variable set in its __init__.py
#see https://docs.djangoproject.com/en/1.9/ref/applications/
for app in apps.get_app_configs():
    if app.name in settings.LOCAL_APPS:
        #the app is one of our experiments! create a url mapping to it, using its label
        urlpatterns.append(url(r'^{0}/'.format(app.label), include(app.name+'.urls', namespace=app.label)))
    
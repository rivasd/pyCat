from django.conf.urls import include, url
from . import views

download_patterns = [
    url(r'^exp/(?P<exp_label>[_A-Za-z][_a-zA-Z0-9]*)$', views.download_exp, name="all")
]

profile_patterns = [
    url(r'^$', views.profile_redirect),
    url(r'^(?P<username>\w+)$', views.profile, name="person")
]

urlpatterns = [
    url(r'^$', views.home, name='homepage'),
    url(r'^claim/(?P<code>[1-9]\d*)$', views.claim, name='claim'),
    url(r'^download/', include(download_patterns, namespace='download')),
    url(r'^profile/', include(profile_patterns, namespace='profile'))
]


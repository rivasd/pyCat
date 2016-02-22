"""
WSGI config for pyCat project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
import sys
import time
import traceback
import signal

if sys.platform == 'linux':
    sys.path.append('/home/drivas/pyCat')

from django.core.wsgi import get_wsgi_application

os.environ["DJANGO_SETTINGS_MODULE"]  = "pyCat.settings"
try:
    application = get_wsgi_application()
    print('WSGI without exception')
except Exception:
    print('handling WSGI exception')
    if 'mod_wsgi' in sys.modules:
        traceback.print_exc()
        os.kill(os.getpid(), signal.SIGINT)
        time.sleep(2.5)
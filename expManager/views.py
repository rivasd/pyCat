from django.shortcuts import render
from django.template import RequestContext
from expManager.models import Payment, Experiment
from django.http.response import JsonResponse
from django.utils.translation import ugettext as _
from expManager.exceptions import PayoutException


# Create your views here.
def home(request):
    """
    The home page of the web experiments section
    """

    
    available = Experiment.objects.all()
    return render(request, 'homepage.html', RequestContext(request, {'manips': available}))


def claim(request, code):
    """
    Another JSON view, this one used to execute payment
    """
    
    error=""
    try:
        payment = Payment.objects.get(pk=code)
        try:
            payment.pay(request)
        except PayoutException as e:
            error =_("Payment delivery failed: ")+str(e)
    except Payment.DoesNotExist:
        payment = None
        error = _("Invalid payment code")
    
    if request.is_ajax():
        if error != "":
            return JsonResponse({'error':error})
        else:
            return JsonResponse({'success': _("Yay! Payment successfully sent to: ")+payment.receiver})
    else:
        return render(request, 'payout.html', RequestContext(request, {'error': error, 'payment': payment}))
    


from django.shortcuts import render, redirect
from django.template import RequestContext
from expManager.models import Payment, Experiment, Participation
from django.http.response import JsonResponse, HttpResponse
from django.utils.translation import ugettext as _
from expManager.exceptions import PayoutException
from django.contrib.auth.decorators import login_required
import io
import zipfile
from expManager.utils import get_csv_iostring_from_participation
import datetime


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
    
@login_required
def download_exp(request, exp_label):
    """
    Force download of a zip file of all the experimental data for the experiment.
    
    If user is not a researcher of the experiment, return a JsonResponse with an error attribute
    """
    
    if not hasattr(request.user, 'researcher'):
        return JsonResponse({'error': _("You do not have permission to view experimental data. Are you logged in as the right user?")})
    
    try:
        exp = request.user.researcher.researchs.prefetch_related('participation_set__subject').get(label=exp_label)
    except:
        return JsonResponse({'error':_("You are not a researcher for this experiment. Permission denied.")})
    
    if 'format' in request.GET:
        format = request.GET['format']
    else:
        format = 'csv'
    if 'design' in request.GET:
        design = request.GET['design']
    else:
        design = 'within'
        
    # Ok time to do the heavy lifting
    the_zip = io.BytesIO()
    main_zipfile = zipfile.ZipFile(the_zip, mode='w', compression = zipfile.ZIP_DEFLATED)
    main_zipfile.debug = 3
    for participation in exp.participation_set.all():
        name = "subject_"+str(participation.subject.id)+"-"+exp_label+"-started_"+str(participation.started).replace(' ', '_').replace(':', '-')[:19]
        data_as_string_io = get_csv_iostring_from_participation(participation)
        main_zipfile.writestr(name+'.csv', data_as_string_io.getvalue())
        data_as_string_io.close() # Better close it, you never know
    main_zipfile.close()
    # Should be done, now send as attachment
    response = HttpResponse(the_zip.getvalue(), content_type="application/zip, application/octet-stream")
    response['Content-Disposition'] = 'attachment; filename="full_data_for_'+exp_label+'_fetched_on_'+str(datetime.date.today())+'.zip"'
    return response

@login_required
def profile_redirect(request):
    return redirect('profile:person', username=request.user.username)
    pass

def profile(request, username):
    # Declare here stuff that should be shown whether viewing your own profile or not
    participations = Participation.objects.prefetch_related('run_set', 'payment', 'experiment').filter(subject__user=request.user)
    is_researcher = hasattr(request.user, 'researcher')
    subject = request.user.subject
    if request.user.is_authenticated() and request.user.username == username: # show full profile when the user views his or her page
        payments = []
        for part in participations:
            if hasattr(part, 'payment') and not part.payment.sent:
                payments.append(part.payment)
        
        if is_researcher:
            researchs = request.user.researcher.researchs.all()
        else:
            researchs = []
            
        context = {
            'participations': participations,
            'is_researcher' : is_researcher,
            'subject'       : subject,
            'payments'      : payments,
            'researchs'     : researchs,
        }
        
        return render(request, 'base_profile.html', context=context)
        
    else: # show brief summary when viewing someone else's profile'
        pass
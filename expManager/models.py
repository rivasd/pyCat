from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from jsonfield import JSONField
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from expManager.exceptions import PayoutException, SettingException
from django.utils.translation import ugettext_lazy as _l
from django.utils.translation import ugettext as _
import paypalrestsdk
import datetime
from gfklookupwidget.fields import GfkLookupField

# I decided to make this app reusable-ish for other researchers, so these are basic abstract classes for experiments and subjects and
# other useful objects in research. they are meant to be subclassed by their own models

class BaseExperiment(models.Model):
    """
    An available experiment implemented on the site
    """
    
    class Meta:
        abstract = True
    
    app_name = models.CharField(max_length=64)
    label = models.CharField(max_length=32, unique=True)
    verbose_name = models.CharField(max_length=128, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    estimated_length = models.CharField(max_length=16, blank=True, null=True)
    allow_repeats = models.BooleanField(help_text="Should participants be able to repeat this experiment? Does not mean they'll get payed twice, but this might create redundant data?")
    compensated = models.BooleanField(help_text="True if some kind of monetary compensation is currently available for subjects who complete the experiment", default=False)
    max_payouts = models.IntegerField(help_text="How many times can a subject get payed (each payout needs a new participation)", blank=True, null=True)
    allow_do_overs = models.BooleanField(help_text="Should we allow subjects to erase non-claimed payments and create a better one by redoing an exp. ?", blank=True, default=False)
    funds_remaining = models.FloatField(blank=True, null=True, help_text="How much money is still available to pay subjects. This is a live setting so better to change this programmatically, ask the administrator.")
    
    def __str__(self):
        return self.verbose_name
    
    def augmentFunds(self, boost):
        if boost <=0:
            raise SettingException(_("Cannot add negative funds to experiment"))
        
        if self.funds_remaining is not None:
            self.funds_remaining = self.funds_remaining + round(boost, 2)
            self.funds_remaining = round(self.funds_remaining, 2)
            self.save()
        else:
            raise SettingException(_("cannot add funds to an unfunded experiment"))
        
    def deductFunds(self, amount):
        if amount <=0:
            raise SettingException(_("Cannot subtract negative funds from experiment"))
        
        if self.funds_remaining is not None:
            self.funds_remaining = self.funds_remaining - amount if self.funds_remaining - amount > 0.0 else 0.0
            self.funds_remaining = round(self.funds_remaining, 2)
            self.save()
        else:
            raise SettingException(_("cannot subtract funds from an unfunded experiment"))

class BaseSubject(models.Model):
    """
    Abstract base model for a registered human subject with it's full profile data
    
    Uses a OnetoOnefied to the base User model that ships with django.
    'User' already has basic contact info and date joined info, so put here fields that are "experimental subject" things like demographics and other
    """
    
    user = models.OneToOneField(User)
    
    class Meta:
        abstract = True
        
    #optional: birthdate of the subject, to calculate age
    birthday = models.DateField(blank=True, null=True)
    
    #optional: sex of the subject. later, add ugettext_lazy() to translate the choices, don't forget!
    gender_choices = (
        ('M', 'male'),
        ('F', 'female'),
        ('O', 'other'),
    )
    sex = models.CharField(choices=gender_choices, max_length=1, blank=True, null=True)
    
    #optional: subject's main occupation
    occupation_choices= (
        ('ft-student', 'full-time student'),
        ('ft-work', 'full-time work'),
        ('pt-student&work', 'part-time student & part-time work'),
        ('ft-student&pt-work', 'full-time student & part-time work'),
    )
    occupation = models.CharField(max_length=32, choices=occupation_choices, blank=True, null=True)
    
    #optional: years of schooling
    years_of_schooling = models.IntegerField(blank=True, null=True)
    
    def __str__(self):
        return self.user.username


# the actual models we are going to be using. Usually this would in another app's models.py importing this file's base abstract classes
# turns out I need exactly what I coded in the base classes and nothing more, so I only need to make them concrete by declaring a class, no other code


class Subject(BaseSubject):
      
    pass
    
class Experiment(BaseExperiment):
    participations = models.ManyToManyField(Subject, through='Participation')
    pass
 
class Researcher(models.Model):
    """
    An extension on the Django user model that represents users who are researchers and allowed to get data.
    
    It does look like a Django permission, but first, I have no idea how to use them, and also, it's nice to store Researcher data like institution, degree, field, etc.
    """
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL)
    institution = models.CharField(max_length=32, blank=True, null=True)
    researchs = models.ManyToManyField(Experiment, blank=True, null=True)
    
class Participation(models.Model):
    """
    Represents a single participation of a Subject to an Experiment
      
    Meant to hold multiple Run objects, allows a participation to be completed in different attempts
    I recommend to always get a Participation instance with select_related()
    """
      
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    complete = models.BooleanField()
    started = models.DateTimeField()
    # browser = models.CharField(max_length=64)
      
    #this is where the magic happens: store options in json format here so that experimental settings stay the same across sessions
    parameters = JSONField()
    
    def createPayment(self, amount, receiver=None, curr='CAD', greedy=None):
        """
        Creates a payment linked to this participation. Default currency canadian dollars
        raises exceptions on failure
        """
        if hasattr(self, 'payment'):
            raise PayoutException(_("Payment already created for this participation"))
        
        if receiver is None:
            receiver = self.subject.user.email

        payment = Payment(participation=self, amount=amount, receiver=receiver)
        payment.save()
        return payment
        
class Run(models.Model):
    """
    Represents a single run of an experiment for a given subject. This is because one subject may split his Participation to
    an Experiment over multiple Runs
    """
    participation = models.ForeignKey(Participation)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    
class Payment(models.Model):
    """
    Represents a claim for PayPal monetary compensation for a completed participation
    
    Avoid creating this liberally, only when it could actually be payed. For now only one payment per participation is enforced.
    I guess you could always create dummy Participation objects to circumvent this
    
    SHOULD NEVER BE CREATED IN BULK. Anyway it does not really make sense to do this.
    """
    
    participation = models.OneToOneField(Participation)
    amount= models.FloatField()
    currency = models.CharField(max_length=3, default='CAD')
    time_created = models.DateTimeField(auto_now_add=True)
    time_sent = models.DateTimeField(blank=True, null=True)
    sent = models.BooleanField(default=False)
    payout_item_id = models.CharField(max_length=16, blank=True, null=True)
    transaction_id = models.CharField(max_length=20, blank=True, null=True)
    payout_batch_id = models.CharField(max_length=16, blank=True, null=True)
    time_processed = models.DateTimeField(blank=True, null=True)
    receiver = models.EmailField(null=True)
    status = models.CharField(max_length=16, blank=True)
    
    def save(self, *args, **kwargs):
        
        self.amount = round(self.amount, 2) # realized amount sometimes return float with crazy decimal developments because computers cannot really represent base-10
        if self.pk is None: # do all the below code only for new instances
            if not self.participation.experiment.compensated:
                raise PayoutException(_("This experiment does not currently offer monetary compensation"))
            
            if self.amount > self.participation.experiment.funds_remaining:
                raise PayoutException(_("Sorry! not enough funds remaining to honor this payment"))
            
            if Payment.objects.filter(participation__experiment=self.participation.experiment, participation__subject=self.participation.subject).count() >= self.participation.experiment.max_payouts:
                raise PayoutException(_("You have exceeded the current limit of payments for this experiment"))
            
            self.participation.experiment.deductFunds(self.amount) # Since a Payment is also a promise to a subject that he/she will get paid, deduct the money immediately on creation
        
        super(Payment, self).save(*args, **kwargs)
    
    def pay(self, request, email=None):
        """
        Attempts to send the funds by PayPal. Since this deals with $$$, exceptions will be thrown if
        inconsistencies occur, make sure to catch them.
        
        Remaining funds are not checked on the Experiment object, they are expected to have been deducted at creation time.
        This means that error codes like INSUFFICIENT_FUNDS returned by PayPal are no joke, it means we did not follow through our promise to pay
        or we added funds that we did not really have.  
        """
        
        if not request.user.is_authenticated():
            raise PayoutException(_("You must be logged in to claim a payment"))
        
        if not self.participation.subject.user == request.user:
            raise PayoutException(_("Payouts must be claimed by the same user who received them"))
        
        if self.sent or self.time_sent is not None or self.time_processed is not None or self.payout_item_id is not None:
            # looks like this has already been paid...
            raise PayoutException(_("Payment already sent. Contact us if this is an error"))
        
        if self.receiver is None:
            raise PayoutException(_("Your account must have an email address confirmed before you can claim payments"))
        
        if email is None:
            email = self.receiver
            
        credentials = SocialApp.objects.get(provider='paypal') #TODO maybe add capabilities to use multiple PayPal accounts? though they would not be private to admins...
        client_id = credentials.client_id
        secret = credentials.secret
        paypalrestsdk.configure({
            'mode': settings.PAYPAL_MODE,
            'client_id': client_id,
            'client_secret': secret
        })
        
        # attempt payout
        payout = paypalrestsdk.Payout({
            "sender_batch_header": {
                "sender_batch_id": "batch_"+str(self.pk),
                "email_subject": _("You have a payment from the Cognition Communication Lab at UQAM"),
            },
            "items": [
                {
                    "recipient_type": "EMAIL",
                    "amount": {
                        "value": round(self.amount, 2),
                        "currency": self.currency,
                    },
                    "receiver": email,
                    "note": _("Thank you!"),
                    "sender_item_id": "item_"+str(self.pk)
                }
            ]
        })
        
        if payout.create(sync_mode=True):
            # DONE: do stuff to mark this payment as completed
            self.sent = True
            self.participation.experiment.deductFunds(float(payout.batch_header.fees.value)) # don't forget to deduct the paypal fees since we pay them!
            self.time_sent = datetime.datetime.now()
            self.payout_batch_id = payout.batch_header.payout_batch_id
            self.status = payout.items[0].transaction_status
            self.payout_item_id = payout.items[0].payout_item_id
            self.transaction_id = payout.items[0].transaction_id
            self.time_processed = payout.items[0].time_processed
            self.save()
            return payout
        else:
            raise PayoutException(payout.error)
    
######################## models to save and manipulate data ##################################


# TODO: Create a custom manager for trials that forces selection of all related objects (the Run, the Participation, the Subject)
class BaseTrial(models.Model):
    """
    Base class to store data for a single experimental trial. This should be the meat and bones of the lab.
    
    
    """
    class Meta:
        abstract = True
    
    internal_node_id = models.CharField(max_length=24)
    trial_index = models.IntegerField()
    trial_type = models.CharField(max_length=32)
    time_elapsed = models.IntegerField()
    timeout = models.BooleanField(blank=True)
    run = models.ForeignKey(Run)
    # TODO: Maybe start denormalizing and include the subject id in the trial model. Should wait and see if the projects takes off and profile it...
    @classmethod
    def get_datafield_names(cls):
        columns = ['subject_id']
        for field in cls._meta.get_fields():
            if field.remote_field is None and not field.auto_created and not field.is_relation:
                columns.append(field.name)
        return columns
    
    def get_subject_id(self):
        return self.run.participation.subject.id
    
    def toDict(self):
        data = {}
        for col in self.get_datafield_names():
            if hasattr(self, col):
                data[col] = getattr(self, col)
        data['subject_id'] = self.get_subject_id()
        return data

class BaseInstruction(models.Model):
    """
    Represents a single page of instruction. make it point to a a model of your choice (for example a model holding settings for a task) so that
    you can retrieve that model with it's instruction_set
    
    NEVER let user input get written to this model, especially if is_html is true. Or else make sure to escape script tags when fetching the content
    """
    
    class Meta:
        abstract = True
        
    @classmethod
    def limit_to_current_app(cls):
        return {'app_label': cls._meta.app_label}
    
    content_type = models.ForeignKey(ContentType)
    object_id = GfkLookupField('content_type')
    task = GenericForeignKey('content_type', 'object_id') # See: https://docs.djangoproject.com/en/1.9/ref/contrib/contenttypes/#generic-relations
    is_html = models.BooleanField(help_text="check this if the content of the instruction text is valid html and wish to have it rendered as such. ")
    text = models.TextField(help_text='Write your instruction page here! it can even be valid html!')
    order = models.PositiveIntegerField(help_text="if a setting has multiple instruction pages, we use this number to sort the order in which you want them presented.")
    after = models.BooleanField(help_text="check if this instruction page is meant to be shown AFTER the task it is attached to.")
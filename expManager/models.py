from django.db import models
from django.contrib.auth.models import User
from jsonfield import JSONField
from django.db.models.fields.related import ForeignKey

# I decided to make this app reusable-ish for other researchers, so these are basic abstract classes for experiments and subjects and
# other useful objects in research. they are meant to be subclassed by their own models

class BaseExperiment(models.Model):
    """
    An available experiment implemented on the site
    """
    
    class Meta:
        abstract = True
    
    app_name = models.CharField(max_length=64)
    label = models.CharField(max_length=32)
    verbose_name = models.CharField(max_length=128)
    description = models.TextField()
    estimated_length = models.CharField(max_length=16)
    
    def __str__(self):
        return self.verbose_name
    

class BaseSubject(User):
    """
    Abstract base model for a registered human subject with it's full profile data
    
    Uses multi-table inheritance from the base User model that ships with django.
    'User' already has basic contact info and date joined info, so put here fields that are "experimental subject" things like demographics and other
    """
    
    class Meta:
        abstract = True
        
    #optional: birthdate of the subject, to calculate age
    birthday = models.DateField()
    
    #optional: sex of the subject. later, add ugettext_lazy() to translate the choices, don't forget!
    gender_choices = (
        ('M', 'male'),
        ('F', 'female'),
        ('O', 'other'),
    )
    sex = models.CharField(choices=gender_choices, max_length=1)
    
    #optional: subject's main occupation
    occupation_choices= (
        ('ft-student', 'full-time student'),
        ('ft-work', 'full-time work'),
        ('pt-student&work', 'part-time student & part-time work'),
        ('ft-student&pt-work', 'full-time student & part-time work'),
    )
    occupation = models.CharField(max_length=32, choices=occupation_choices)
    
    #optional: years of schooling
    years_of_schooling = models.IntegerField()
    

# the actual models we are going to be using. Usually this would in another app's models.py importing this file's base abstract classes
# turns out I need exactly what I coded in the base classes and nothing more, so I only need to make them concrete by declaring a class, no other code


class Subject(BaseSubject):
      
    pass
     
class Experiment(BaseExperiment):
    participations = models.ManyToManyField(Subject, through='Participation')
    pass
 
class Participation(models.Model):
    """
    Represents a single participation of a Subject to an Experiment
      
    So as to not pollute the database, should be created only when at least some usable data has been received.
    Participation objects have a 'complete' field, so it is possible to save intermediate completions in case your
    experiment has to be divided in multiple Runs.
    """
      
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    complete = models.BooleanField()
    started = models.DateTimeField()
    browser = models.CharField(max_length=64)
      
    #this is where the magic happens: store options in json format here so that experimental settings stay the same across sessions
    parameters = JSONField()
      
    pass

class Run(models.Model):
    """
    Represents a single run of an experiment for a given subject. This is because one subject may split his Participation to
    an Experiment over multiple Runs
    """
    participation = models.ForeignKey(Participation)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
######################## models to save and manipulate data ##################################

class BaseBlock(models.Model):
    """
    Base class for an experimental block (series of consecutive similar trials)
    
    A great deal of psychological experiments are structured through blocks of trials. 
    This model is used to group trials by block but it is not necessary to use it, some experiments are not sturctured with trial blocks
    Since I still haven't solved the foreignkeys-to-abstract-models problem, and blocks get most of their meaning from the Participation and Trials they are linked to,
    This class will be mostly empty for now :(
    """
    
    class Meta:
        abstract = True
    
    block_type = models.CharField(max_length=16)
    order_in_run = models.IntegerField()
    run = models.ForeignKey(Run)
    
class BaseTrial(models.Model):
    """
    Base class to store data for a single experimental trial
    
    provided fields are: order within the block, order within the whole experiment, a generic 'type' field
    """
    order_in_run = models.IntegerField()
    order_in_block = models.IntegerField()
    type = models.CharField(max_length = 32)
    run = models.ForeignKey(Run)
    
    pass


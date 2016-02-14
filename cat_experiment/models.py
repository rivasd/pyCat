from django.db import models
from expManager.models import BaseBlock, BaseTrial, Participation
from django.db.models.fields.related import ForeignKey
from django.utils.translation import ugettext as _
from expManager.exceptions import SettingException
import json

#Create your models here.
class Block(BaseBlock):
    pass
    
class CategorizationTrial(BaseTrial):
    handles = 'categorize'
    key_press = models.IntegerField()
    rt = models.IntegerField()
    correct = models.BooleanField()
    category = models.CharField(max_length=16)
    
class SimilarityTrial(BaseTrial):
    handles = 'similarity'
    sim_score = models.IntegerField()
    rt = models.IntegerField()
    firstStim = models.CharField(max_length=16)
    secondStim = models.CharField(max_length=16)
    kind = models.CharField(max_length=10)
    distance = models.IntegerField()
    
    
    
############## models for experimental settings #####################
    
class GeneralSettingManager(models.Manager):
    def retrieve(self, which):
        instance = super(GeneralSettingManager, self).get(name=which)
        instance.timeline = []
        microcomponent = {}
        rawPairs = instance.microcomponentpair_set.all().values()
        for pair in rawPairs:
            microcomponent[pair['index']] = {
                '0': "/static/cat_experiment/attributes/"+pair['first'],
                '1': "/static/cat_experiment/attributes/"+pair['second']
            }
        instance.microcomponents = microcomponent
        instance.duringLoad = _("Please wait while images are created...")
        categories = {}
        for category in instance.category_set.all().values():
            categories[category['name']] = category['keycode']
            
        instance.categories = categories
        return instance
    
class SimilarityManager(models.Manager):
    def retrieve(self, which):
        instance = super(SimilarityManager, self).get(name=which)
        instance.type = "similarity"
        instance.labels = [_("very different"), _("identical")]
        return instance
    
class CategorizationManager(models.Manager):
    def retrieve(self, which):
        instance = super(CategorizationManager, self).get(name=which)
        instance.type = "categorize"
        instance.correct_text = _("correct!")
        instance.incorrect_text = _("Oops! Incorrect!")
        return instance
    
class GeneralSetting(models.Model):
    """
    Experimental settings that aplly to a whole experimental run, including stimuli creation settings
    
    Use its add_to_timeline method to push other setting objects containing settings related to particular blocks
    """
    
    objects = GeneralSettingManager()
    
    name = models.CharField(max_length=16, unique=True, help_text="An identifier for this set of settings, for example 'production' or 'test settings' ")
    sample_table_height = models.IntegerField(help_text='In the table of sample stimuli shown at the beginning, how many images hight should the table be.' )
    sample_table_width = models.IntegerField(help_text="In the table of sample stimuli shown at the beginning, how many images across should the table be.")
    max_consecutive_timeouts = models.IntegerField(help_text="The experiment will automatically abort if this number if the subject does not respond fast enough to this many consecutive trials")
    max_total_timeouts = models.IntegerField(help_text="The experiment will automatically abort if this many trials are allowed to timeout in total")
    fixation_cross = models.CharField(max_length = 32, help_text="The path to fixation cross image, will be appended to static/your_app_name/")
    levels = models.IntegerField(help_text="Starting from the easiest difficulty (all microcomponents are invariants), how many difficulty levels should be allowed? (the final difficulty will be chosen at random among the allowed levels)")
    # Stimuli creation settings
    density = models.IntegerField(help_text="how many micro components should fit along the height and width of the finished stimulus, controls how dense is the stimulus")
    
    def timeline(self):
        return self.timeline
    
    def pushToTimeline(self, settingObject):
        if not isinstance(settingObject, dict):
            raise SettingException("you can only add dictionaries to a timeline")
        self.timeline.append(settingObject)
        
    def toDict(self):
        dictionary = dict(self.__dict__)
        del dictionary['_state']
        return dictionary
    
    def __str__(self):
        return self.name
    
class MicroComponentPair(models.Model):
    index = models.IntegerField()
    setting = models.ForeignKey(GeneralSetting)
    first = models.CharField(max_length=16)
    second = models.CharField(max_length=16)
    
    def __str__(self):
        return self.setting.name + "-" + str(self.index)
    
class SimilarityPhaseSetting(models.Model):
    """
    Settings for a similarity judgment task
    """
    
    objects = SimilarityManager()
    
    show_response_choices = (
        ('FIRST_STIMULUS', 'With the first stimulus'),
        ('SECOND_STIMULUS', 'With the second stimulus'),
        ('POST_STIMULUS', 'After both stimuli have disappeared'),                 
    )
    
    name = models.CharField(max_length=16, unique=True, help_text="An identifier for this set of settings, for example 'production' or 'test settings' ")
    length = models.IntegerField(help_text="How many trials should this phase comprise.")
    intervals = models.IntegerField(help_text="How many different choices are available on the slider. For example, 5 will limit the options to 5 different places on the slider")
    show_ticks = models.BooleanField(help_text="If true, then the slider will have tick marks indicating where the response options lie on the slider.")
    show_response = models.CharField(max_length=16, choices=show_response_choices, help_text="When should the response slider be shown?")
    timing_first_stim = models.IntegerField(help_text="How long to show the first stimulus for in milliseconds.")
    timing_second_stim = models.IntegerField(help_text="How long to show the second stimulus for in milliseconds. -1 will show the stimulus until a response is made by the subject.")
    timing_image_gap = models.IntegerField(help_text="How long to show a blank screen in between the two stimuli.")
    timing_post_trial = models.IntegerField(help_text="Sets the time, in milliseconds, between the current trial and the next trial.")
    prompt = models.CharField(max_length=32, blank=True, help_text="Any content here will be displayed below the stimulus, as a reminder to the participant")
    is_practice = models.BooleanField(help_text="True if this phase is meant to be a practice block")

    def __str__(self):
        return self.name
    
    def toDict(self):
        dictionary = dict(self.__dict__)
        del dictionary['_state']
        return dictionary
    

class CategorizationPhaseSetting(models.Model):
    """
    Settings for a categorization task
    """
    
    objects = CategorizationManager()
        
    name = models.CharField(max_length=16, unique=True, help_text="An identifier for this set of settings, for example 'production' or 'test settings' ")
    length = models.IntegerField(help_text="How many trials should this phase comprise")
    show_stim_with_feedback = models.BooleanField(default=False, help_text="Should the stimulus be shown together with the feedback text?")
    show_feedback_on_timeout = models.BooleanField(default=False, help_text="Should we show the feedback even when the trial times out?")
    is_practice = models.BooleanField(help_text="True if this phase is meant to be a practice block")
    timing_stim = models.IntegerField(help_text="How long to show the stimulus for (milliseconds). If -1, then the stimulus is shown until a response is given.")
    timing_feedback_duration = models.IntegerField(help_text="How long to show the feedback for ")
    timing_response = models.IntegerField(help_text="The maximum time allowed for a response. If -1, then the experiment will wait indefinitely for a response.")
    timing_post_trial = models.IntegerField(help_text="Sets the time, in milliseconds, between the current trial and the next trial.")
    
    def __str__(self):
        return self.name
    
    def toJSON(self):
        self.finalize()
        return
    
    def toDict(self):
        dictionary = dict(self.__dict__)
        del dictionary['_state']
        return dictionary
    
class Category(models.Model):
    name = models.CharField(max_length=16)
    keycode = models.IntegerField()
    setting = models.ForeignKey(GeneralSetting)
    
    def __str__(self):
        return self.name
    
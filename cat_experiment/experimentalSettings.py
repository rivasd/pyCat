from django.utils.translation import ugettext_lazy as _

class BaseSettings(object):
    """
    Abstract class meant to hold all necessary experimental settings.
    
    Has a single staticmethod returning the complete settings as JSON dictionnary, ready to send to a Javascript program client-side
    """
    
    sample_table_dimensions = [4, 4]
    """how many stimuli (height width) should fit in the example screen"""
    
    max_consecutive_timeouts = 3
    """The maximal number of consecutive trials a participant is allowed to timeout on before experiment aborts"""
    
    max_total_timeouts = 20
    """Max number of trials allowed to timeout across the whole experiment before it aborts """
    
    fixation_cross = "cross.png"
    """Path to the fixation cross image to be used. will be appended to this package's static/cat_experiment path """
    
    intro_instructions = [
        _('each element in this array is a page shown at the beginning of the experiment')
    ]
    
    att_number = 6
    """How many micro components should compose a single stimulus """
    
    density = 45
    """ """
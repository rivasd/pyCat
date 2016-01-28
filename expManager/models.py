from django.db import models

# Create your models here.

class Experiment(models.Model):
    """
    An experiment available implemented on this site
    """
    app_name = models.CharField(max_length=64)
    label = models.CharField(max_length=32)
    verbose_name = models.CharField(max_length=128)
    description = models.TextField()
    estimated_length = models.CharField(max_length=16)
    
    def __unicode__(self):
        return self.verbose_name
from django.db import models
from expManager.models import BaseBlock, BaseTrial, Participation
from django.db.models.fields.related import ForeignKey

# Create your models here.
class Block(BaseBlock):
    run = ForeignKey(Participation, on_delete=models.CASCADE)
    
class Trial(BaseTrial):
    block = models.ForeignKey(Block, on_delete=models.CASCADE)
    run = ForeignKey(Participation, on_delete=models.CASCADE)
    
    #fields specific to our experiment
    similarity = models.IntegerField()
    rt = models.IntegerField()
    correct = models.BooleanField()
    pair_type = models.CharField(max_length = 16)
    pair_distance = models.IntegerField()
    stimulus_category = models.CharField(max_length= 16)
'''
Created on Feb 19, 2016

@author: Daniel
'''

from modeltranslation.translator import register, TranslationOptions
from .models import MyInstruction

@register(MyInstruction)
class InstructionTranslationOptions(TranslationOptions):
    fields = ('text',)
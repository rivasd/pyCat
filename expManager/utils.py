'''
Created on Feb 12, 2016

@author: Daniel
'''
from expManager.models import Run, BaseTrial
import csv
import io


def sort_trials(data):
    bulks = {}
    for trial in data:
        type = trial['trial_type']
        if type in bulks:
            # add this trial to the list
            bulks[type].append(trial)
        else:
            bulks[type] = [trial]
            
    return bulks

def get_trial_relations_for_exp(experiment): # TODO: handle case where stupid users might not want to subclass expManager.models.BaseTrial for their trial models
    """
    Find all subclasses of expManager.models.BaseTrial that belong to the given experiment and that point to the expManager.models.Run model through a ForeignKey
    
    If you are not subclassing my expManager.models.BaseTrial model, (why???) this will not yield correct results and code your own
    function that gets the models that hold data for you
    """
    
    rels = []
    for relation in Run._meta.get_fields():  # @UndefinedVariable
        if relation.is_relation and relation.one_to_many and relation.related_model._meta.app_label == experiment.label and issubclass(relation.related_model, BaseTrial):
            rels.append(relation)
    return rels

def get_all_fields(relations):
    """
    Takes a list of subclasses of expManager.models.BaseTrial and yields a list of every data field defined among them; no repeats!
    
    Again, do not use if, for some god-forsaken reason, you do not subclass BaseTrial for your trial-data models
    """
    fields = []
    for rel in relations:
        for field in rel.related_model.get_datafield_names():
            if not field in fields:
                fields.append(field)
    return fields

def get_participation_data_as_dict_array(participation):
    """
    Returns a list of dicts, one for each subclass of expManager.models.BaseTrial that is part of the given participation
    """
    data = []
    rels = get_trial_relations_for_exp(participation.experiment)
    for run in participation.run_set.all():
        for one2manyrel in rels:
            manager_name = one2manyrel.related_name if one2manyrel.related_name is not None else one2manyrel.related_model.__name__.lower() + '_set'
            for trial in getattr(run, manager_name).all():
                data.append(trial.toDict())
    return data

def get_csv_iostring_from_participation(participation):
    stringfile = io.StringIO(newline='')
    header_list = get_all_fields(get_trial_relations_for_exp(participation.experiment))
    datawriter = csv.DictWriter(stringfile, header_list)
    datawriter.writeheader()
    datawriter.writerows(get_participation_data_as_dict_array(participation))
    # stringfile.close() It must not be closed or else we will get a value error when putting its contents to the zipfile
    return stringfile
        
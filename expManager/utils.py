'''
Created on Feb 12, 2016

@author: Daniel
'''


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

from django.apps import AppConfig


class ExpmanagerConfig(AppConfig):
    name = 'expManager'
    
    def ready(self):
        # do things when all models of all apps and all settings have been imported
        # like for example registering Signals
        
        import expManager.handlers
from django.db import models
from authentication.models import Account

class Recsys(models.Model):
    name = models.CharField(max_length=40, blank=False)
    url_name = models.CharField(max_length=40, blank=False)
    repo_base = models.CharField(max_length=40, blank=False)
    repo_name = models.CharField(max_length=140, blank=False)
    item_table_name = models.CharField(max_length=140, blank=False)
    primary_key_field = models.CharField(max_length=140)
    title_field = models.CharField(max_length=140)
    description_field = models.CharField(max_length=140)
    image_link_field = models.CharField(max_length=140)
    universal_code_field = models.CharField(max_length=140)
    template = models.TextField()
    solr_core_name = models.CharField(max_length=40, null=True)
    status = models.CharField(max_length=40, blank=False, default="paused") # paused or active
    owner = models.ForeignKey(Account)

    # objects = models.Manager()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # USERNAME_FIELD = ''
    REQUIRED_FIELDS = []

    def __unicode__(self):
        return '{0}'.format(self.content)

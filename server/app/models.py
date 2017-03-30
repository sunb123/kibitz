from __future__ import unicode_literals

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.sessions.backends.db import SessionStore as DBStore
from django.contrib.sessions.base_session import (AbstractBaseSession, BaseSessionManager,)
from django.db import models
from authentication.models import Account

class AccountManager(BaseUserManager):
    # NOTE: don't use these methods. can't lock file and create user at same time.
    def create_user(self, email, password=None, **kwargs):
        if not email:
            raise ValueError('Users must have a valid email address.')
        if not kwargs.get('username'):
            raise ValueError('Users must have a valid username.')
        account = self.model(
            email=self.normalize_email(email), username=kwargs.get('username'), access_token=kwargs.get('access_token'),
            refresh_token=kwargs.get('refresh_token')
        )
        account.set_password(password)
        account.save()
        return account

    def create_superuser(self, email, password, **kwargs):
        account = self.create_user(email, password, **kwargs)
        account.is_admin = True
        account.save()
        return account

class Rating(models.Model):
    item_id = models.PositiveIntegerField()
    recsys_id = models.PositiveIntegerField()
    rating = models.IntegerField(blank=False)
    universal_code = models.CharField(max_length=999, null=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #objects = models.Manager() # TODO: abstract manager class
    # USERNAME_FIELD = ''
    REQUIRED_FIELDS = []

class NotInterested(models.Model):
    item_id = models.PositiveIntegerField()
    recsys_id = models.PositiveIntegerField()
    universal_code = models.CharField(max_length=999, null=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #objects = models.Manager() # TODO: abstract manager class
    # USERNAME_FIELD = ''
    REQUIRED_FIELDS = []

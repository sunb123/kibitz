from __future__ import unicode_literals

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.sessions.backends.db import SessionStore as DBStore
from django.contrib.sessions.base_session import (AbstractBaseSession, BaseSessionManager,)
from django.db import models

class AccountManager(BaseUserManager):
    # NOTE: don't use these methods. can't lock file and create user at same time.
    def create_user(self, email=None, password=None, **kwargs):
        # if not email:
        #     raise ValueError('Users must have a valid email address.')
        if not kwargs.get('username'):
            raise ValueError('Users must have a valid username.')
        account = self.model(
            email=self.normalize_email(email), username=kwargs.get('username'), access_token=kwargs.get('access_token',''),
            refresh_token=kwargs.get('refresh_token','')
        )
        account.set_password(password)
        account.save()
        return account

    def create_superuser(self, password, email=None, **kwargs):
        account = self.create_user(email, password, **kwargs)
        account.is_admin = True
        account.is_superuser = True
        account.save()
        return account

class Account(AbstractUser):
    is_admin = models.BooleanField(default=False)
    access_token = models.CharField(max_length=999, blank=True)
    refresh_token = models.CharField(max_length=999, blank=True)

    objects = AccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __unicode__(self):
        return self.email

    def get_full_name(self):
        return ' '.join([self.first_name, self.last_name])

    def get_short_name(self):
        return self.first_name


class MyBackend(object):
    def authenticate(self, username):
        print "my backend executed"
        return Account.objects.get(username=username)

    def get_user(self, user_id):
        try:
            return Account.objects.get(pk=user_id)
        except Account.DoesNotExist:
            return None


class SessionManager(BaseSessionManager):
    use_in_migrations = True

class CustomSession(AbstractBaseSession):
    username = models.CharField(max_length=40, unique=True, db_index=True, blank=False)
    recsys_id = models.IntegerField(null=True, db_index=True) # TODO: proper declaration of int field.

    objects = SessionManager()

    @classmethod
    def get_session_store_class(cls):
        return SessionStore

    class Meta(AbstractBaseSession.Meta):
        db_table = 'custom_session'

class SessionStore(DBStore):
    @classmethod
    def get_model_class(cls):
        return CustomSession

    def create_model_instance(self, data):
        obj = super(SessionStore, self).create_model_instance(data)
        try:
            #print 'created with username'
            username = str(data.get('username'))
            recsys_id = int(data.get('recsys_id'))
        except (ValueError, TypeError):
            print 'error: created without username or recsys_id'
            username = None
            recsys_id = None
        obj.username = username
        obj.recsys_id = recsys_id
        return obj
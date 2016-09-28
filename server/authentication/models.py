from __future__ import unicode_literals

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.sessions.backends.db import SessionStore as DBStore
from django.contrib.sessions.base_session import (AbstractBaseSession, BaseSessionManager,)
from django.db import models

class AccountManager(BaseUserManager):
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

class Account(AbstractBaseUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=40, unique=True)

    first_name = models.CharField(max_length=40, blank=True)
    last_name = models.CharField(max_length=40, blank=True)
    tagline = models.CharField(max_length=140, blank=True)

    access_token = models.CharField(max_length=999, blank=False)
    refresh_token = models.CharField(max_length=999, blank=False)

    is_admin = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AccountManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username','access_token','refresh_token']

    def __unicode__(self):
        return self.email

    def get_full_name(self):
        return ' '.join([self.first_name, self.last_name])

    def get_short_name(self):
        return self.first_name

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
        db_table = 'django_session'

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
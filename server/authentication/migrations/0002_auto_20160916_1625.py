# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='access_token',
            field=models.CharField(default='', max_length=999),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='account',
            name='refresh_token',
            field=models.CharField(default='', max_length=999),
            preserve_default=False,
        ),
    ]

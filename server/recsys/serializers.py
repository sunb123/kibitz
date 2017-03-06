from rest_framework import serializers
from recsys.models import Recsys


class RecsysSerializer(serializers.ModelSerializer):

    class Meta:
        model = Recsys

        fields = ('id', 'author', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_validation_exclusions(self, *args, **kwargs):
        exclusions = super(PostSerializer, self).get_validation_exclusions()

        return exclusions + ['author']
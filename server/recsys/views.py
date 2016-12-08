import requests
import subprocess
import sys

from django.shortcuts import render
from django.http import HttpResponse

from rest_framework import viewsets
from rest_framework.response import Response
from recsys.models import Recsys
from recsys.serializers import RecsysSerializer

from app.user_methods import makeRequest, getUserIdFromUsername, is_logged_in_admin, is_logged_in_user
from recsys.methods import checkRecsysParams

class RecsysViewSet(viewsets.ViewSet):
    #lookup_field = 'username'
    queryset = Recsys.objects.all()
    serializer_class = RecsysSerializer

    @is_logged_in_admin
    def list(self, request): # GET
        r = None
        username, sessionid = request.COOKIES.get('username'), request.COOKIES.get('sessionid')
        print username, sessionid
        owner_id = getUserIdFromUsername(username)
        print owner_id
        query = "select * from kibitz.recsys where owner_id='{}' order by id asc;".format(owner_id)
        api_url = '/api/v1/query/test321/kibitz'
        r = makeRequest('POST', api_url, 'master', query=query)
        return HttpResponse(r)

    @is_logged_in_admin
    def create(self, request): # POST
        print("got create")
        if request.data.get('file') != None:
            return HttpResponse(request.data.get('file'))


        # TODO: check recsys name and url unique


        access_token = masterAccessToken()
        recsys_params = tuple([param for param in request.data])
        # TODO: ensure those (ordered) and only those recsys params
        queryRecsys = "insert into kibitz.recsys {};".format(recsys_params)
        api_url = '/api/v1/query/test321/kibitz'

        # TODO: check params. url unique, repo/table exist. match the owner id.
        params = checkRecsysParams(request.data['recsys_params'], request.user)



        # create recsys object in master DH. preselect recsys repo and item table.
        r = makeRequest('POST', api_url, 'master', query=query)

        # create user, rating table
        api_url = '/api/v1/repos/{}/{}'.format(params['repo'], params['table'])
        queryRating = ''
        r = makeRequest('POST', api_url, request.user, data={'table_name': 'users'})
        r = makeRequest('POST', api_url, request.user, data={'table_name': 'ratings'})

        # deploy app
        # subprocess.call( ['../scripts/deploy.sh -n {}'.format(request.data('url')) ])

        # p = subprocess.Popen([sys.executable, ''],
        #                             stdout=subprocess.PIPE,
        #                             stderr=subprocess.STDOUT)

        subprocess.Popen(['../scripts/deploy.sh', '', 'file'])

        return HttpResponse("recsys create")

    #@is_logged_in_admin
    def retrieve(self, request, pk=None): # GET with pk
        # TODO: get recsys pk from recsys name and user name.
        # get user row from user name, get owner_id
        #print("got retrieve", pk)

        recsys_name = request.query_params.get('recsys_name')
        recsys_url = request.query_params.get('recsys_url')
        if recsys_name != None:
            query = "select * from kibitz.recsys where name='{}';".format(recsys_name)
        elif recsys_url != None:
            query = "select * from kibitz.recsys where url_name='{}';".format(recsys_url)
        else:
            query = "select * from kibitz.recsys where id='{}';".format(pk)

        api_url = '/api/v1/query/test321/kibitz'
        r = makeRequest('POST', api_url, 'master', query=query)
        return HttpResponse(r)

    @is_logged_in_admin
    def update(self, request, pk=None): # PUT with pk
        print("got update")
        # TODO: check that current admin user is recsys' owner
        params = request.data.get('params')
        print params
        print pk
        if params != None:
            query = "update kibitz.recsys set "
            for param_type, param in params.iteritems():
                query += "{}='{}', ".format(param_type, param)
            query = query[:-2] + " where id='{}';".format(pk)
            api_url = '/api/v1/query/test321/kibitz'
            r = makeRequest('POST', api_url, 'master', query=query)
            return HttpResponse(r)
            # css linking
            # regular param update
        return HttpResponse("no recsys update")

    # def partial_update(self, request, pk=None): # PATCH with pk
    #     return HttpResponse("recsys partial update")

    @is_logged_in_admin
    def destroy(self, request, pk=None): # DELETE with pk
        print("got destroy")
        # TODO: delete script, delete recsys object.
        return HttpResponse("recsys destroy")
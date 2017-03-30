import requests, subprocess, sys, json
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.core import serializers
# from django.contrib.auth.decorators import login_required

from recsys.models import Recsys
from recsys.serializers import RecsysSerializer

from app.user_methods import is_logged_in, is_admin
from app.user_methods import makeRequest, makeGetRequest
from recsys.methods import checkRecsysUrlUnique
from app.global_vars import default_recsys_template, SERVER_HOME
from app.methods import getItemTableFormat
from app.system_methods import lock_decorator

from authentication.models import Account
from recsys.models import Recsys

class RecsysViewSet(viewsets.ViewSet):
    queryset = Recsys.objects.all()
    serializer_class = RecsysSerializer

    @is_logged_in
    @is_admin
    def list(self, request): # GET
        user_id = request.user.id
        owner_id = Account.objects.get(id=user_id)
        recsysList = Recsys.objects.filter(owner_id=owner_id)
        return HttpResponse( serializers.serialize('json',recsysList) )

    @is_logged_in
    @is_admin
    def create(self, request): # POST - using datahub item table
        data = request.data
        username = request.user.username
        urlName = data.get('url_name')
        recommenderName = data.get('name','')
        if recommenderName == '':
            return HttpResponse("no recommender name. failed")
        if not checkRecsysUrlUnique(urlName):
            return Response({
                'status': 'url_error',
                'message': 'Url already taken'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = Account.objects.get(username=username)
        owner_id = user.id
        repo_base = username
        repo_name = data.get('repo_name')
        item_table_name = data.get('item_table_name')

        # create recsys object
        recsys = Recsys(name=recommenderName, url_name=urlName, repo_base=repo_base, repo_name=repo_name,
            item_table_name=item_table_name)
        recsys.primary_key_field = data.get('primary_key_field')
        recsys.title_field = data.get('title_field')
        recsys.description_field = data.get('description_field')
        recsys.image_link_field = data.get('image_link_field','')
        recsys.universal_code_field = data.get('universal_code_field','')
        recsys.owner = user
        recsys.status = 'paused'
	template = default_recsys_template
	template['item_fields_include'] = [recsys.title_field, recsys.description_field]
        recsys.template = json.dumps(template)
        recsys.save()
        print "recsys saved"

        #########

        # check if there is overall rating field, if not then add it
        # TODO: if don't require item id, need to add it
        api_url = '/api/v1/repos/{}/{}/tables/{}'.format(repo_base, repo_name, item_table_name)
        resp = makeGetRequest(api_url, owner_id)
        print resp, "request return"

        columns = resp.json()['columns']
        has_overall_rating = False
        has_id = False # NOTE: currently must provide id field
        for col in columns:
            if col.get('column_name') == 'overall_rating': # NOTE: will override ratings
                has_overall_rating = True
        #     if col.get('column_name') == 'id':
        #         has_id = True
        # if not has_id:
        #     api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
        #     query = "ALTER TABLE {}.{} ADD {} {}".format(repo_name, item_table_name, 'id', 'text')
        #     r = makeRequest('POST', api_url, owner_id, query=query)
        #     print r.content
        #     api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
        #     query = "select (*) from {}.{};".format(master_repo, item_table_name)
        #     r = makeRequest('POST', api_url, owner_id, query=query)
        #     if r.status_code == 200:
        #         count = r.json()['rows'][0]
        #         queryID = "insert into {}.{} ( id ) values ".format(repo_name, item_table_name)
        #         for i in xrange(count)""
        #             queryID += "({}),".format(str(i))
        #         r = makeRequest('POST', api_url, owner_id, query=queryID)
        #         print r.content
        if not has_overall_rating:
            api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
            query = "ALTER TABLE {}.{} ADD {} {}".format(repo_name, item_table_name, 'overall_rating', 'text')
            r = makeRequest('POST', api_url, owner_id, query=query)
            # print r.content

        output = subprocess.check_output([SERVER_HOME+'/scripts/deploy.sh', '-n', urlName])

        return HttpResponse("recsys")

    #@is_logged_in
    #@is_admin
    def retrieve(self, request, pk=None): # GET with pk
        user_id = request.user.id
        recsys_url = request.query_params.get('recsys_url')

        recsys = None
        if recsys_url != None:
            recsys = Recsys.objects.filter(owner_id=user_id, url_name=recsys_url).first()
        elif pk != None:
            recsys = Recsys.objects.filter(owner_id=user_id, pk=pk).first()

        if recsys == None:
            return Response({
                'status': 'Bad request',
                'message': 'Recsys not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        return HttpResponse( serializers.serialize('json', [recsys,]) )

    @is_logged_in
    @is_admin
    def update(self, request, pk=None): # PUT with pk
        if pk == None:
            return Response({
                        'status': 'Bad request',
                        'message': 'No recsys id provided'
                    }, status=status.HTTP_400_BAD_REQUEST)

        username = request.user.username
        user = Account.objects.get(username=username)
        user_id = user.id
        recsys = Recsys.objects.get(id=pk)
        recsys_owner_id = recsys.owner_id
        # current_url = recsys.url_name

        if user_id != recsys_owner_id:
            return Response({
                        'status': 'Bad request',
                        'message': 'Not the owner of recsys'
                    }, status=status.HTTP_400_BAD_REQUEST)
        else:
            params = request.data.get('params')
            if params != None:
                # if not checkRecsysUrlUnique(params.get('url_name')) and current_url != params.get('url_name'):
                #     return Response({
                #         'status': 'Bad request',
                #         'message': 'Url already taken'
                #     }, status=status.HTTP_400_BAD_REQUEST)

                for param_type, param in params.iteritems():
                    if param_type != 'url_name':
                        if param_type == 'owner':
                            setattr(recsys, 'owner_id', param)
                        else:
                            setattr(recsys, param_type, param)
                recsys.save()
                return HttpResponse("recsys updated")

        return HttpResponse("no recsys update")

    # def partial_update(self, request, pk=None): # PATCH with pk
    #     return HttpResponse("recsys partial update")

    @is_logged_in
    @is_admin
    def destroy(self, request, pk=None): # DELETE with pk
        recsys = Recsys.objects.get(id=pk)
        urlName = recsys.url_name
        if recsys.owner_id == request.user.id:
            output = subprocess.check_output([SERVER_HOME+'/scripts/delete.sh', '-n', urlName])
            recsys.delete()
            return HttpResponse("recsys destroyed")
        else:
            return HttpResponse("not recsys owner")

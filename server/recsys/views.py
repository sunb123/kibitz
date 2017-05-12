import requests, subprocess, sys, json, StringIO, csv
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.core import serializers
# from django.contrib.auth.decorators import login_required

from app.user_methods import is_logged_in, is_admin
from app.user_methods import makeRequest, makeGetRequest, makeDeleteRequest
from app.global_vars import default_recsys_template, SERVER_HOME
from app.methods import getItemTableFormat, datahub_table_to_solr_csv
from app.system_methods import lock_decorator

from authentication.models import Account
from recsys.serializers import RecsysSerializer
from recsys.models import Recsys
from recsys.methods import checkRecsysUrlUnique, checkUrlFormat, formatUrl, formatTableName


def isValidNumber(value):
    try:
        value = float(value)
    except:
        value = None

    if type(value) == float:
        return True
    else:
        return False
 
def getFilterFieldValues(filter_fields, repo_base, repo_name, item_table_name, owner_id):
    '''
        return dict: 
           {
             field1: {type: ..., values:[...]}
             ...
           }  

        makes an API to DH for each qualitative field
        gets top 12 most frequent field values

        for numerical field, get the min and max field values
    '''
    api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
    query = "select " 
    for field in filter_fields:
        query += "min({}), max({}), ".format(field, field)
    query = query[:-2]
    query += " from {}.{};".format(repo_name, item_table_name)
    r = makeRequest('POST', api_url, owner_id, query=query)
    if r.status_code == 200:
        filter_field_values = {} # field : {type: x, values: []}
        min_max_dict = r.json()['rows'][0]
        for i in xrange(len(filter_fields)):
            field = filter_fields[i]
            if i == 0:
                minimum, maximum = min_max_dict.get('min'), min_max_dict.get('max')
            else:
                minimum, maximum = min_max_dict.get('min_'+str(i)), min_max_dict.get('max_'+str(i))

            if isValidNumber(minimum) and isValidNumber(maximum): # NOTE: can batch all numerical min/max calls
                query = "select min(cast({} as float)), max(cast({} as float)) from {}.{} ;".format(field, field, repo_name, item_table_name)
                r = makeRequest('POST', api_url, owner_id, query=query)
                if r.status_code == 200:
                    value_obj = r.json()['rows'][0]
                    minimum, maximum = value_obj.get('min'), value_obj.get('max')
                    filter_field_values[field] = {'type':'numerical', 'values':[minimum, maximum]}
                else:
                    filter_field_values[field] = {}
            else:
                query = "select count(*), {} from {}.{} group by {} order by count(*) desc limit 12;".format(field, repo_name, item_table_name, field)
                r = makeRequest('POST', api_url, owner_id, query=query)
                if r.status_code == 200:
                    rows = r.json()['rows']
                    values = map(lambda x: x.get(field), rows) 
                    filter_field_values[field] = {'type':'qualitative', 'values':values}
                else:
                    filter_field_values[field] = {}

        return filter_field_values
    else:
        print query
        print r.content
        return []
         

def addIdField(repo_base, repo_name, item_table_name, owner_id):
    api_url = '/api/v1/repos/{}/{}/tables/{}'.format(repo_base, repo_name, item_table_name)
    resp = makeGetRequest(api_url, owner_id)
    print resp, "request return"
    columns = resp.json()['columns']
    #has_overall_rating = False
    has_id = False # NOTE: currently must provide id field
    for col in columns:
    #    if col.get('column_name') == 'overall_rating': # NOTE: will override ratings
    #        has_overall_rating = True
         if col.get('column_name') == 'id':
             has_id = True
    if not has_id:
        api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
        query = "ALTER TABLE {}.{} ADD {} {}".format(repo_name, item_table_name, 'id', 'text')
        r = makeRequest('POST', api_url, owner_id, query=query)
        print r.content
        api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
        query = "select count(*) from {}.{};".format(repo_name, item_table_name)
        r = makeRequest('POST', api_url, owner_id, query=query)
        if r.status_code == 200:
            count = r.json()['rows'][0].get('count')
            queryID = "insert into {}.{} ( id ) values ".format(repo_name, item_table_name)
            for i in xrange(count):
                queryID += "({}),".format(str(i))
            r = makeRequest('POST', api_url, owner_id, query=queryID)
            print r.content
        return r.status_code
    #if not has_overall_rating:
    #    api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)
    #    query = "ALTER TABLE {}.{} ADD {} {}".format(repo_name, item_table_name, 'overall_rating', 'text')
    #    r = makeRequest('POST', api_url, owner_id, query=query)
        # print r.content    pass

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
        if not checkUrlFormat(urlName):
            return Response({
                'status': 'url_error',
                'message': 'Url format has error'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = Account.objects.get(username=username)
        owner_id = user.id
        repo_base = username
        repo_name = data.get('repo_name')
        item_table_name = data.get('item_table_name')
        primary_key_field = data.get('primary_key_field','')
        solr_core_name = formatUrl(urlName)

        # create recsys object
        recsys = Recsys(name=recommenderName, url_name=urlName, repo_base=repo_base, repo_name=repo_name,
            item_table_name=item_table_name)
        recsys.primary_key_field = primary_key_field 
        recsys.title_field = data.get('title_field','')
        recsys.description_field = data.get('description_field','')
        recsys.image_link_field = data.get('image_link_field','')
        recsys.universal_code_field = data.get('universal_code_field','')
        recsys.owner = user
        recsys.status = 'paused'
        recsys.solr_core_name = solr_core_name
        recsys.template = json.dumps(default_recsys_template)
        recsys.save()

        #########

        if primary_key_field == None:
            addId = addIdField(repo_base, repo_name, item_table_name, owner_id)
            if addId != 200:
                return HttpResponse("failed to add id field")

        # prepare solr csv file from DH table
        file_url_solr = datahub_table_to_solr_csv(owner_id, repo_base, repo_name, item_table_name, primary_key_field)

        # setup solr core and index       
        output = subprocess.check_output(['/var/www/html/kibitz/server/scripts/solr_setup.sh', '-c', solr_core_name, '-f', '{}'.format(file_url_solr)]) 
        print output

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
        recsys_template_dict = json.loads(recsys.template)
        recsys_filter_fields = recsys_template_dict.get('filter_fields')
        item_table_name = recsys.item_table_name

        if user_id != recsys_owner_id:
            return Response({
                        'status': 'Bad request',
                        'message': 'Not the owner of recsys'
                    }, status=status.HTTP_400_BAD_REQUEST)
        else:
            params = request.data.get('params')
            if params == None:
                return HttpResponse("no recsys update")
            # TODO: 
            # if change repo or table, 
            #     try to create a new solr core for recsys and reindex.
            for param_type, param in params.iteritems():
                if param_type == 'template':
                    template_dict = json.loads(param)
                    filter_fields = template_dict.get('filter_fields')
                    print filter_fields, recsys_filter_fields, "TEST"
                    if filter_fields != recsys_filter_fields:
                        filter_field_values = getFilterFieldValues(filter_fields, recsys.repo_base, recsys.repo_name, item_table_name, recsys_owner_id)
                        template_dict['filter_field_values'] = filter_field_values
                        template = json.dumps(template_dict)
                        print template
                        setattr(recsys, 'template', template)
                elif param_type != 'url_name':
                    if param_type == 'owner':
                        setattr(recsys, 'owner_id', param)
                    elif param != None:
                        setattr(recsys, param_type, param)
                    else:
                        setattr(recsys, param_type, '')
            recsys.save()
            return HttpResponse("recsys updated")

        return HttpResponse("no recsys update")

    # def partial_update(self, request, pk=None): # PATCH with pk
    #     return HttpResponse("recsys partial update")

    @is_logged_in
    @is_admin
    def destroy(self, request, pk=None): # DELETE with pk
        recsys = Recsys.objects.get(id=pk)
        owner_id = recsys.owner_id
        urlName = recsys.url_name
        repo_base = recsys.repo_base
        repo_name = recsys.repo_name

        item_table_name_from_csv = formatTableName(urlName) # used to delete a CSV created table
        solr_core_name = recsys.solr_core_name 

        if owner_id == request.user.id:
            output = subprocess.check_output(['/var/www/html/kibitz/server/scripts/solr_delete_instance.sh', '-c', solr_core_name]) 
            print output
            
            # try deleting table from CSV upload
            api_url = '/api/v1/repos/{}/{}/tables/{}/'.format(repo_base, repo_name, item_table_name_from_csv)
            r = makeDeleteRequest(api_url, owner_id)

            # TODO: delete leftover ratings, notInterested, users??

            output = subprocess.check_output([SERVER_HOME+'/scripts/delete.sh', '-n', urlName])
            print output
            recsys.delete()
            return HttpResponse("recsys destroyed")
        else:
            return Response({
                        'status': 'Bad request',
                        'message': 'Not the owner of recsys'
                   }, status=status.HTTP_400_BAD_REQUEST)

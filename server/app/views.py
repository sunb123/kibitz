import json
import requests
import subprocess

from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse

from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri
from app.user_methods import is_logged_in_admin, is_logged_in_user, createAdminUser, createAdminUserRow, updateAdminUserRow, createEndUser, \
createSessionForUser, makeRequest, makeGetRequest, getUserBy, getRecsysRow
from recsys.methods import getRecsysColumnFields

from app.global_vars import userTableFormat, ratingTableFormat
from app.methods import getItemTableFormat, makeRating, updateItemRating

from rest_framework.response import Response
from rest_framework.parsers import JSONParser

# TODO: add CSRF tokens
# TODO: add proper logging, api endpoint and grammar isolation
# TODO: add HTML/CSS editing


class AuthCodeToAccessTokenView(views.APIView): # set access and refresh tokens to DH user

    def post(self, request, format=None):
        code = request.data.get('code')
        username = request.data.get('username')
        payload = {
          'code' : code,
          'client_id': auth_client_id,
          'client_secret': auth_client_secret,
          'redirect_uri': redirect_uri,
          'grant_type': 'authorization_code',
        }
        url = base_url + '/oauth2/token/'
        r = requests.post(url, data=payload)
        if r.status_code == 200:
            access_token, refresh_token = r.json()['access_token'], r.json()['refresh_token']
            resp = requests.get(base_url+'/api/v1/user',headers={'Authorization':'Bearer '+access_token})
            username = resp.json().get('username')
            updateAdminUserRow({'access_token':access_token, 'refresh_token':refresh_token}, username=username)
            return HttpResponse("saved access tokens")
        else:
            return HttpResponse("failed to get tokens")

class CSVUploadView(views.APIView): # Create recsys by CSV upload

    @is_logged_in_admin
    def get(self, request, pk=None, format=None):
        # TODO: check rec name and url are unique universally.
        username = request.COOKIES.get('username')
        recommenderName = request.data.get('name') # NOTE: uses original recommender name to create all repos and tables
        urlName = request.data.get('url')

        file = request.data.get('file')
        raw_item_headers = file.readline().strip()

        # TODO: add extra items with csv file
        # if recommender already exists, and is owner, check headers match item table
        # then add extra rows to table.

        item_headers = [header.lower() for header in raw_item_headers.split(',')]

        # TODO: check that headers are correct
        # if 'title' not in item_headers or 'description' not in item_headers:
        #     return HttpResponse("CSV needs title and description columns")

        # create recsys object in master DH. insert into recsys table.
        recsys_id = '((select count(*) from kibitz.recsys)+1)' # TODO: change this to find highest id and add one to it.
        user = getUserBy('username', username)
        if user != None:
            user_id = user.get('id')
        else:
            user_id = None
        recsys_params = tuple([recsys_id, recommenderName, recommenderName, recommenderName+'_item', recommenderName+'_rating', \
         recommenderName+'_user', 'primary_key', 'title_field', 'description_field', 'image_link_field', 'rating_field', \
         'paused', urlName, '5', '', user_id])
        query = "insert into kibitz.recsys values ({}, '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}');" \
         .format(*recsys_params)
        api_url = '/api/v1/query/test321/kibitz'
        r = makeRequest('POST', api_url, 'master', query=query)

        ############################
        # operations in admin DH
        ############################

        # create repo for all tables
        api_url = '/api/v1/repos/{}'.format(username)
        r = makeRequest('POST', api_url, user_id, data={'repo_base': username, 'repo_name':recommenderName})

        # create item table from CSV
        # TODO: rename item field if 'id' is taken
        itemTableFormat = getItemTableFormat(item_headers)
        print itemTableFormat

        item_table_name = recommenderName+'_item'
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={ "table_name": item_table_name, "params": itemTableFormat})

        # insert items into table
        api_url = '/api/v1/query/{}/{}'.format(username, recommenderName)
        query = "insert into {}.{} values ".format(recommenderName, item_table_name)
        for i, line in enumerate(file):
            if i != 0:
                values = line.strip().split(',')
                values.insert(0,str(i))
                query += "{},".format(tuple(values))
        query = query[:-1]+';'
        print query
        r = makeRequest('POST', api_url, user_id, query=query)

        # create rating table
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={"table_name": recommenderName+'_rating', "params": ratingTableFormat})

        # create user table
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={"table_name": recommenderName+'_user', "params": userTableFormat})

        # deploy app with recsys params
        output = subprocess.check_output(['./scripts/deploy.sh', '-n', urlName])

        return HttpResponse(output)

# TODO:
class CSSTemplateView(views.APIView):

    def get(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("css get "+str(pk))

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("css post")

    def put(self, request, pk=None, format=None):
        return HttpResponse(request.data.get('cssText'))

class RepoTableView(views.APIView):

    @is_logged_in_admin
    def get(self, request, pk=None, format=None): # get admin user's tables or repos.
        username = request.COOKIES.get('username')
        repo = request.query_params.get('repo', None)
        table = request.query_params.get('table', None)

        user = getUserBy('username', username)
        if user != None:
            user_id = user.get('id')
        else:
            user_id = None

        if repo == None:
            api_url = '/api/v1/repos/{}'.format(username) # username same as repo base
            resp = makeGetRequest(api_url, user_id) # TODO: change to user name
            return HttpResponse(resp)
        elif table == None:
            api_url = '/api/v1/repos/{}/{}/tables'.format(username, repo) # username same as repo base
            resp = makeGetRequest(api_url, user_id) # TODO: change to user name
            return HttpResponse(resp)
        else: # get table columns
            api_url = '/api/v1/repos/{}/{}/tables/{}'.format(username, repo, table) # username same as repo base
            resp = makeGetRequest(api_url, user_id) # TODO: change to user name
            return HttpResponse(resp)

class AdminUserView(views.APIView):

    def get(self, request, pk=None, format=None):
        return HttpResponse("user get "+str(pk))

    def post(self, request, pk=None, format=None): # create
        data = request.data
        if data.get('password') != None:
            user_params = [data['username'], data['email'], data['password']]
            resp = createAdminUser(*user_params) # create user account in DH
        else:
            resp = "need password to create user"
        return HttpResponse(resp)

    def put(self, request, pk=None, format=None): # update
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")

class EndUserView(views.APIView):

    def get(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("user get "+str(pk))

    def post(self, request, pk=None, format=None):
        data = request.data
        if data.get('password') != None:
            params = [data['username'], data.get('email',''), data['password'], data['recsys_id']]
            resp = createEndUser(*params) # create user account in DH
            return HttpResponse(resp)

        return HttpResponse("FAIL. user not created")

    def put(self, request, pk=None, format=None):
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")

class ItemView(views.APIView):

    @is_logged_in_user
    def get(self, request, pk=None, format=None):
        # list get or individual get. currently get all at once.
        username = request.COOKIES.get('myusername')
        recsys_id = request.query_params.get('recsys_id')
        recsys = getRecsysRow(recsys_id)

        owner_id = recsys.get('owner_id')
        owner = getUserBy('id', owner_id)
        owner_name = owner.get('username')

        api_url = '/api/v1/query/{}/{}'.format(owner_name, recsys.get('repo_name'))
        query = "select * from {}.{} order by cast(id as int) asc;".format(recsys.get('repo_name'), recsys.get('item_table_name'))

        return_dict = {}
        # TODO: get all items (with pagination)
        r = makeRequest('POST', api_url, owner_id, query=query)
        if r.status_code == 200:
            return_dict['items'] = r.json()['rows']
            # print r.json()['rows']
            #return JsonResponse(r.json())

        # get most popular items. items sorted by highest average ratings. get top 10 items.
        api_url = '/api/v1/query/{}/{}'.format(owner_name, recsys.get('repo_name'))
        query = "select * from {}.{} where cast(id as int) between 50 and 70 order by cast(id as int) asc;".format(recsys.get('repo_name'), recsys.get('item_table_name'))
        r = makeRequest('POST', api_url, owner_id, query=query)
        if r.status_code == 200:
            popular_items = r.json()['rows']
            return_dict['popular_items'] = popular_items

        # get a user's rated items.
        if username != None:
            user = getUserBy('username', username, recsys_id)
            api_url = '/api/v1/query/{}/{}'.format(owner_name, recsys.get('repo_name'))
            query = "select * from {}.{} where user_id='{}';".format(recsys.get('repo_name'), recsys.get('rating_table_name'), user.get('id'))
            print query
            r = makeRequest('POST', api_url, owner_id, query=query) # get all ratings where user_id = my_id
            if r.status_code == 200:
                ratings = r.json()['rows']
                item_ids = [str(rating.get('item_id')) for rating in ratings]
                print item_ids
                api_url = '/api/v1/query/{}/{}'.format(owner_name, recsys.get('repo_name'))
                query = "select * from {}.{} where id in ".format(recsys.get('repo_name'), recsys.get('item_table_name'))
                if len(item_ids) == 1:
                    query += "('{}');".format(item_ids[0])
                elif len(item_ids) != 0:
                    query += "{};".format(tuple(item_ids))
                else:
                    return JsonResponse(return_dict)

                print query
                r = makeRequest('POST', api_url, owner_id, query=query) # get items where id in (the ids)
                print r.content

                if r.status_code == 200:
                    rated_items = r.json()['rows']
                    return_dict['rated_items'] = rated_items



        # TODO: get items sorted by a column. search on field

        return JsonResponse(return_dict)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass

class RatingView(views.APIView):

    def get(self, request, pk=None, format=None):
        return HttpResponse(request.user)

    @is_logged_in_user
    def post(self, request, pk=None, format=None):
        username = request.COOKIES.get('myusername')
        item_id = request.data.get('item_id')
        rating = request.data.get('rating')
        recsys_id = request.data.get('recsys_id')

        resp = makeRating(username, item_id, rating, recsys_id)
        updateItemRating(item_id, recsys_id)

        return HttpResponse(resp)

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass


class RecommendationView(views.APIView):

    #@is_logged_in_user
    def get(self, request, pk=None, format=None):
        # get top items from recommendation
        username = 'sunb1' #request.COOKIES.get('username')
        recsys_id = 3 #request.data.get('recsys_id')

        output = subprocess.check_output(['/usr/local/spark/bin/spark-submit','./test.py', str(recsys_id), str(username), '100'])
        return HttpResponse(output)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass
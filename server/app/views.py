import json
import requests

from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse

from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri
from app.user_methods import is_logged_in, createAdminUser, createAdminUserRow, updateAdminUserRow, createEndUser, \
createSessionForUser, makeRequest, makeGetRequest, getUserBy
from recsys.methods import getRecsysColumnFields

from app.global_vars import userTableFormat, ratingTableFormat
from app.methods import getItemTableFormat

from rest_framework.response import Response
from rest_framework.parsers import JSONParser

# TODO: add recommendation engine with Spark
# TODO: add CSRF tokens
# TODO: add proper logging, api endpoint and grammar isolation

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

    @is_logged_in
    def post(self, request, pk=None, format=None):
        username = request.COOKIES.get('username')
        recommenderName = request.data.get('name')
        urlName = request.data.get('url')

        # TODO: check rec name and url are unique universally.

        file = request.data.get('file')
        raw_item_headers = file.readline()
        text = file.read()

        # if recommender already exists, and is owner, check headers match item table
        # then add extra rows to table.
        item_headers = [header.lower() for header in raw_item_headers.split(',')]

        # if 'title' not in item_headers or 'description' not in item_headers:
        #     return HttpResponse("CSV needs title and description columns")

        # create recsys object in master DH. insert into recsys table.
        recsys_id = '((select count(*) from kibitz.recsys)+1)'
        user = getUserBy('username', username)
        if user != None:
            user_id = user.get('id')
        else:
            user_id = None
        recsys_params = tuple([recsys_id, recommenderName, recommenderName, recommenderName+'_item', recommenderName+'_rating', \
         recommenderName+'_user', 'paused', urlName, '5', '', user_id])
        query = "insert into kibitz.recsys values ({}, '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}');".format(*recsys_params)
        api_url = '/api/v1/query/test321/kibitz'
        r = makeRequest('POST', api_url, 'master', query=query)

        ############################
        # operations in admin DH
        ############################

        # create repo for all tables
        api_url = '/api/v1/repos/{}'.format(username)
        r = makeRequest('POST', api_url, user_id, data={'repo_base': username, 'repo_name':recommenderName})

        # create item table from CSV
        itemTableFormat = getItemTableFormat(item_headers)
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={ "table_name": "mytablename", "params": itemTableFormat})

        # insert items into table
        api_url = '/api/v1/query/test321/a'
        query = "insert into a.mytablename values (2);"
        r = makeRequest('POST', api_url, user_id, query=query)

        # create rating table
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={"table_name": "mytablename_rating", "params": ratingTableFormat})

        # create user table
        api_url = '/api/v1/repos/{}/{}/tables'.format(username, recommenderName)
        r = makeRequest('POST', api_url, user_id, data={"table_name": "mytablename_user", "params": userTableFormat})


        api_url = '/api/v1/query/test321/a'
        query = "insert into a.mytablename_user values "
        for i in xrange(5000):
            query += "('{}', '', '', ''),".format(i)
        query = query[:-1] + ';'
        print query
        r = makeRequest('POST', api_url, user_id, query=query)


        # deploy app with recsys params

        return HttpResponse(text)




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

    @is_logged_in
    def get(self, request, pk=None, format=None): # get admin user's tables or repos.
        username = request.COOKIES.get('username')
        repo = request.query_params.get('repo', None)
        table = request.query_params.get('table', None)

        if repo == None:
            api_url = '/api/v1/repos/{}'.format(username) # username same as repo base
            resp = makeGetRequest('GET', api_url, 'master') # TODO: change to user name
            return HttpResponse(resp)
        elif table == None:
            api_url = '/api/v1/repos/{}/{}/tables'.format(username, repo) # username same as repo base
            resp = makeGetRequest('GET', api_url, 'master') # TODO: change to user name
            return HttpResponse(resp)
        else: # get table columns
            api_url = '/api/v1/repos/{}/{}/tables/{}'.format(username, repo, table) # username same as repo base
            resp = makeGetRequest('GET', api_url, 'master') # TODO: change to user name
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
        # TODO: add access and refresh tokens to user row in master DH
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")





















class EndUserView(views.APIView):
    permission_classes = () #(permissions.IsAuthenticated,)

    def get(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("user get "+str(pk))

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("user post")

    def put(self, request, pk=None, format=None):
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")

class ItemView(views.APIView):
    permission_classes = () #(permissions.IsAuthenticated,)

    @is_logged_in # don't show items unless logged in
    def get(self, request, pk=None, format=None):
        # list get or individual get

        # get a user's rated items.
        # get most popular items. items sorted by highest average ratings
        # get all items (with pagination)

        # if pk == None
        # TODO: get all items for a recsys
        # request.data.get: recsys id, find owner of recsys, get items from that admin DH table


        #data = json.loads(request.body)
        return HttpResponse(request.auth)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass

class RatingView(views.APIView):
    permission_classes = () #(permissions.IsAuthenticated,)

    def get(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse(request.user)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass




# TODO: Add Spark recommendation
class RecommendationView(views.APIView):
    permission_classes = () #(permissions.IsAuthenticated,)

    def get(self, request, pk=None, format=None):
        # get top items from recommendation


        #data = json.loads(request.body)
        return HttpResponse(request.data)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass
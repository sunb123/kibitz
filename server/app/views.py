import json, requests, subprocess, re, ast, csv, sys
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from django.http import HttpResponse, JsonResponse
# from django.contrib.auth.decorators import login_required
from django.db.models import Q

from app.user_methods import is_logged_in, is_admin
from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri, master_dh_query_url, master_repo, rating_table, recsys_table
from app.user_methods import createAdminUser, updateAdminUserWithNewTokens, createEndUser, makeRequest, makeGetRequest
from recsys.methods import checkRecsysUrlUnique

from app.global_vars import required_recsys_params, default_recsys_template, recsys_param_format, SPARK_HOME, SERVER_HOME
from app.methods import getItemTableFormat, makeRating, removeRating, updateItemRating, makeNotInterested, removeNotInterested
from app.system_methods import createSessionForUser, getUniqueDictList, lock_decorator, properStringForQuery, whereInClauseQuery

from authentication.models import Account
from recsys.models import Recsys
from app.models import Rating, NotInterested

class AuthCodeToAccessTokenView(views.APIView): # set access and refresh tokens to DH admin user

    @is_logged_in
    @is_admin
    def post(self, request, format=None):
        code = request.data.get('code')
        username = request.data.get('username')
        response = updateAdminUserWithNewTokens(username, code)
        return response

class CSVUploadView(views.APIView): # Create recsys by CSV upload

    @is_logged_in
    @is_admin
    def post(self, request, pk=None, format=None):
        data = request.data
        username = request.user.username #request.COOKIES.get('k_username')
        urlName = data.get('url_name')
        recommenderName = data.get('name','')

        if recommenderName == '':
            return HttpResponse("no recommender name. failed")
        if not checkRecsysUrlUnique(urlName):
            return Response({
                'status': 'url_error',
                'message': 'Url already taken'
            }, status=status.HTTP_400_BAD_REQUEST)
        user = Account.objects.get(username=username) #getUserBy('username', username)
        owner_id = user.id #user.get('id')

        item_table_name = urlName+'_item'
        required_headers = json.loads(data.get("required_headers")) # dict of {'title': title_field, 'description': description_field, ..}

        file = data.get('file')
        reader = enumerate(csv.reader(file, delimiter=','))
        raw_item_headers = reader.next()[1]
        all_headers = [header.lower() for header in raw_item_headers] # list of other fields

        print all_headers

        ############################
        # operations in admin DH
        ############################

        # create repo for item table
        api_url = '/api/v1/repos/{}'.format(username)
        r = makeRequest('POST', api_url, owner_id, data={'repo_base': username, 'repo_name':urlName})

        # create item table from CSV. add id and overall_rating if not there.
        itemTableFormat = getItemTableFormat(all_headers)
        print itemTableFormat

        api_url = '/api/v1/repos/{}/{}/tables'.format(username, urlName)
        r = makeRequest('POST', api_url, owner_id, data={ "table_name": item_table_name, "params": itemTableFormat})

        # insert items into table
        api_url = '/api/v1/query/{}/{}'.format(username, urlName)

        count = 0
        query = "insert into {}.{} values ".format(urlName, item_table_name)
        for i, values in reader:
            if count == 4094: # NOTE: split calls into chunks for Datahub
                query = query[:-1]
                r = makeRequest('POST', api_url, owner_id, query=query)
                print r.status_code, r.content
                count = 0
                query = "insert into {}.{} values ".format(urlName, item_table_name)
            elif i != 0:
                count += 1
                #values = [repr(val) for val in values]
                if 'id' not in all_headers:
                    values.insert(0,str(i)) #id field
                if 'overall_rating' not in all_headers:
                    values.append('') # overall rating field
                #print values
                for i, val in enumerate(values):
                    if i == 0: # NOTE: include E to allow escape chars for postgresql
                        query += "(E'{}',".format(properStringForQuery(val))
                    elif i == len(values)-1:
                        query += "E'{}'),".format(properStringForQuery(val))
                    else:
                        query += "E'{}',".format(properStringForQuery(val))

        #print query
        query = query[:-1]
        r = makeRequest('POST', api_url, owner_id, query=query)
        #print r.status_code

        # create recsys object
        recsys = Recsys(name=recommenderName, url_name=urlName, repo_base=username, repo_name=urlName,
            item_table_name=item_table_name)
        recsys.primary_key_field = 'id'
        recsys.title_field = required_headers.get('title')
        recsys.description_field = required_headers.get('description')
        recsys.image_link_field = required_headers.get('image','')
        recsys.universal_code_field = required_headers.get('univ_code','')
        recsys.owner = user
        recsys.status = 'paused'
        recsys.template = json.dumps(default_recsys_template)
        recsys.save()

        # deploy app with recsys params
        output = subprocess.check_output([SERVER_HOME+'/scripts/deploy.sh', '-n', urlName])

        return HttpResponse(output)

class CSVReuploadView(views.APIView):

    @is_logged_in
    @is_admin
    def post(self, request, pk=None, format=None):
        data = request.data
        username = request.user.username
        user_id = request.user.id
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        owner_id = recsys.owner_id
        repo_base = recsys.repo_base
        repo_name = recsys.repo_name

        required_headers = json.loads(data.get("required_headers")) # dict of {'title': title_field, 'description': description_field, ..}

        file = data.get('file')
        reader = enumerate(csv.reader(file, delimiter=','))
        raw_item_headers = reader.next()[1]
        all_headers = [header.lower() for header in raw_item_headers] # list of other fields

        print all_headers

        ############################
        # operations in admin DH
        ############################


        # TODO: create new table with new headers, change recsys item table to new table.

        # create item table from CSV. add id and overall_rating if not there.
        itemTableFormat = getItemTableFormat(all_headers)
        print itemTableFormat

        api_url = '/api/v1/repos/{}/{}/tables'.format(repo_base, repo_name)
        r = makeRequest('POST', api_url, owner_id, data={ "table_name": item_table_name, "params": itemTableFormat})

        # insert items into table
        api_url = '/api/v1/query/{}/{}'.format(repo_base, repo_name)

        count = 0
        query = "insert into {}.{} values ".format(repo_name, item_table_name)
        for i, values in reader:
            if count == 4094: # NOTE: split calls into chunks for Datahub
                query = query[:-1]
                r = makeRequest('POST', api_url, owner_id, query=query)
                print r.status_code, r.content
                count = 0
                query = "insert into {}.{} values ".format(repo_name, item_table_name)
            elif i != 0:
                count += 1
                #values = [repr(val) for val in values]
                if 'id' not in all_headers:
                    values.insert(0,str(i)) #id field
                if 'overall_rating' not in all_headers:
                    values.append('') # overall rating field
                #print values
                for i, val in enumerate(values):
                    if i == 0: # NOTE: include E to allow escape chars for postgresql
                        query += "(E'{}',".format(properStringForQuery(val))
                    elif i == len(values)-1:
                        query += "E'{}'),".format(properStringForQuery(val))
                    else:
                        query += "E'{}',".format(properStringForQuery(val))

        #print query
        query = query[:-1]
        r = makeRequest('POST', api_url, owner_id, query=query)
        #print r.status_code

class RepoTableView(views.APIView):

    @is_logged_in
    def get(self, request, pk=None, format=None): # get admin user's repos and tables
        username = request.user.username #request.COOKIES.get('k_username') # username same as repo base
        user = Account.objects.get(username=username) #getUserBy('username', username)
        print "got user"
        if user != None:
            user_id = user.id #user.get('id')
        else:
            user_id = None
	print "user id", user_id

        data = {}
        api_url = '/api/v1/repos/{}'.format(username)
        resp = makeGetRequest(api_url, user_id)
        print "got repos"

        repos = resp.json()['repos'] # owner, href, repo_name
        data['repos'] = repos

        for repo in repos:
            api_url = '/api/v1/repos/{}/{}/tables'.format(username, repo['repo_name'])
            resp = makeGetRequest(api_url, user_id)
            print "got a table"
            tables = resp.json()['tables'] # href, table_name
            repo['tables'] = tables

            for table in tables:
                api_url = '/api/v1/repos/{}/{}/tables/{}'.format(username, repo['repo_name'], table['table_name'])
                resp = makeGetRequest(api_url, user_id)
                columns = resp.json()['columns']
                table['columns'] = columns

        print repos

        return JsonResponse(data)

class RecsysParamsView(views.APIView):

    def get(self, request, pk=None, format=None):
        recsys_url = request.query_params.get('recsys_url')
        recsys = Recsys.objects.get(url_name=recsys_url)
        selected_keys = ['id','name','url_name', 'status', 'template', 'primary_key_field', 'title_field', \
        'description_field', 'image_link_field', 'universal_code_field']
        return JsonResponse({key: getattr(recsys, key) for key in selected_keys})

class NotInterestedItemsView(views.APIView):

    def get(self, request, pk=None, format=None):
        user_id = request.user.id
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        owner_id = recsys.owner_id
        repo_base = recsys.repo_base
        item_metas = NotInterested.objects.filter(recsys_id=recsys_id, user_id=user_id)
        item_ids = [str(meta.item_id) for meta in item_metas]

        api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
        query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
        query += whereInClauseQuery("id", item_ids, False)
        query += "order by cast(id as int) asc;"

        r = makeRequest('POST', api_url, owner_id, query=query)
        print r.content
        if r.status_code == 200:
            items = r.json()['rows']
            return JsonResponse({'items':items})

        return HttpResponse("status:", r.status_code)

class ItemView(views.APIView): # TODO: allow non-logged in users to get items (give most popular items)

    @is_logged_in
    def get(self, request, pk=None, format=None): # list get
        username = request.user.username
        user_id = request.user.id
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        owner_id = recsys.owner_id
        repo_base = recsys.repo_base
        universal_code_field = recsys.universal_code_field

        # exclude not interested items
        item_metas = NotInterested.objects.filter(user_id=user_id) # get not interested items across all recsys
        item_ids = [str(meta.item_id) for meta in item_metas if str(meta.recsys_id) == recsys_id] # filter not interested items for current recsys
        univ_codes = [str(meta.universal_code) for meta in item_metas if meta.universal_code != None]

        api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
        query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
        query += whereInClauseQuery("id", item_ids, True, universal_code_field, univ_codes, True)
        query += "order by cast(id as int) asc;"

        print query

        return_dict = {}
        r = makeRequest('POST', api_url, owner_id, query=query) # exclude not interested items
        if r.status_code == 200:
            return_dict['items'] = r.json()['rows']
        else:
            #print r.json(), r.content, r.status_code
            return HttpResponse("failed to get items")    
    
        ratings = Rating.objects.all()

#        return JsonResponse(return_dict)

        # STEP 1: Attach rating distribution for each item
        for item in return_dict['items']:
            item_ratings = ratings.filter(Q(item_id=int(item.get('id'))) | Q(universal_code=item.get(universal_code_field))) # NOTE: get ratings across recsys
            total_rating_count = len(item_ratings)
            distribution_count = {1:0, 2:0, 3:0, 4:0, 5:0}
            distribution_percentage = {1:0, 2:0, 3:0, 4:0, 5:0}
            if total_rating_count != 0:
                for rating in item_ratings:
                    r = rating.rating
                    distribution_count[r] = distribution_count.get(r) + 1
                for k in distribution_percentage.keys():
                    distribution_percentage[k] = distribution_count.get(k) / float(total_rating_count)
            item['total_rating_count'] = total_rating_count
            item['distribution_count'] = distribution_count
            item['distribution_percentage'] = distribution_percentage

        # STEP 2: Attach popular items. sort by most ratings
        return_dict['trending_items'] = sorted(return_dict['items'], key=lambda item: item.get('total_rating_count'), reverse=True)


#        return JsonResponse(return_dict)


        # STEP 3: get rated items. attach my ratings
        if username != None:
            user = Account.objects.get(username=username) #getUserBy('username', username, recsys_id)
            ratings = Rating.objects.filter(user=user) #r.json()['rows'] # TODO: give user id or user object???
            ratings_dict = {rating.item_id: rating.rating for rating in ratings}
            rated_items = []

            recsys_rated_item_ids = set([str(rating.item_id) for rating in ratings if rating.recsys_id == int(recsys_id)])
            rated_items.extend( filter(lambda x: x.get('id') in recsys_rated_item_ids, return_dict['items']) )
            # get rated items across different recsys but also found in given recsys
            all_rated_item_codes = set([str(rating.universal_code) for rating in ratings if rating.universal_code != None])
            rated_items.extend( filter(lambda x: x.get(universal_code_field) in all_rated_item_codes, return_dict['items']) )
            my_rated_items = getUniqueDictList(rated_items, recsys.primary_key_field)

            for item in my_rated_items:
                rating = ratings_dict[int(item.get('id'))]
                item['my_rating'] = rating
            return_dict['rated_items'] = my_rated_items

        # STEP 4: Get recommended items
            if len(ratings) != 0:
                output = subprocess.check_output([SPARK_HOME+'/bin/spark-submit',SERVER_HOME+'/recommender.py', str(recsys_id), str(user.id), '100'])#, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) # use Popen to debug
		#returncode = output.wait()
		#print('ping returned {0}'.format(returncode))
		#out = output.stdout.read()
		#print(out)
		print "recommender out: ", output
	        #print type(out)
	 	#print ast.literal_eval(out)

		if output != []:
			rec_ratings = ast.literal_eval(output)
			rec_rating_dict = {}
			for rating in rec_ratings:
			    rec_rating_dict[rating.get('item_id')] = rating.get('rating')
			recommended_item_ids = set([str(rating.get('item_id')) for rating in rec_ratings])
			recommended_items = filter(lambda x: x.get('id') in recommended_item_ids, return_dict['items'])
			for item in recommended_items:
			    item['suggested_rating'] = str(rec_rating_dict.get(int(item['id'])))
			recommended_items = sorted(recommended_items, key=lambda x: x.get('suggested_rating'), reverse=True)[:20] # get top 20 recommendations
                else:
			recommended_items = []
		return_dict['recommended_items'] = recommended_items

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
        return JsonResponse(request.user)

    @is_logged_in
    def post(self, request, pk=None, format=None): # make rating for logged in user
        username = request.user.username #request.COOKIES.get('k_username')
        item_id = request.data.get('item_id')
        rating = request.data.get('rating')
        recsys_id = request.data.get('recsys_id')
        makeRating(username, item_id, rating, recsys_id)
        updateItemRating(item_id, recsys_id)
        return HttpResponse("rating done")

    def put(self, request, pk=None, format=None):
        pass

    @is_logged_in
    def delete(self, request, pk=None, format=None): # remove rating
        username = request.user.username 
        item_id = request.data.get('item_id')
        rating = request.data.get('rating')
        recsys_id = request.data.get('recsys_id')
        removeRating(username, item_id, rating, recsys_id)
        updateItemRating(item_id, recsys_id)
        return HttpResponse("delete rating done")

class NotInterestedView(views.APIView):

    def get(self, request, pk=None, format=None):
        return JsonResponse(request.user)

    @is_logged_in
    def post(self, request, pk=None, format=None): # make not interested for logged in user
        username = request.user.username 
        item_id = request.data.get('item_id')
        recsys_id = request.data.get('recsys_id')
        makeNotInterested(username, item_id, recsys_id)
        return HttpResponse("not interested done")

    def put(self, request, pk=None, format=None):
        pass

    @is_logged_in
    def delete(self, request, pk=None, format=None): # remove not interested for logged in user
        username = request.user.username
        item_id = request.data.get('item_id')
        recsys_id = request.data.get('recsys_id')
        removeNotInterested(username, item_id, recsys_id)
        return HttpResponse("delete not interested done")


class RecommendationView(views.APIView):

    @is_logged_in
    def get(self, request, pk=None, format=None): # get recommended of logged in user
        # get top items from recommendation
        # print request.user.username

        # return HttpResponse("test get")

        # from django.contrib.auth import authenticate, login, logout
        # user = Account.objects.get(username='test')
        # user.set_password('asd')
        # user.save()

        # user = authenticate(username='test', password='asd')
        # print user.is_authenticated(), user.backend

        # return HttpResponse()

        username = request.user.username #request.COOKIES.get('k_username')
        recsys_id = request.query_params.get('recsys_id')
        user = Account.objects.get(username=username) # TODO: user filter if user doesn't exist
        user_id = user.id
        # user_id = getUserBy('username', username).get('id')

        # print subprocess.check_output(['/usr/local/spark/bin/spark-submit','./recommender.py', str(recsys_id), str(user_id), '100'])
        # output = 1
        # print "recommender out: ", output

        process = subprocess.Popen([SPARK_HOME+'/bin/spark-submit',SERVER_HOME+'/recommender.py', str(recsys_id), str(user_id), '100'],
                           stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT)
        returncode = process.wait()
        print('output returned {0}'.format(returncode))
        #print(process.stdout.read())
        p = process.stdout.read()

        return HttpResponse(p)

    def post(self, request, pk=None, format=None):
        #data = json.loads(request.body)
        return HttpResponse("something post")

    def put(self, request, pk=None, format=None):
        pass

    def delete(self, request, pk=None, format=None):
        pass


class WidgetTestView(views.APIView):

    def get(self, request, pk=None, format=None):
        params = request.query_params
        print params
        if params.get('item_id') != None:
            return JsonResponse({"message":"success. rating get"})
        return JsonResponse({"message":"success. login checl"})

    def post(self, request, pk=None, format=None):
        return JsonResponse({"message":"success. got post"})

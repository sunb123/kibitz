import json, requests, subprocess, re, ast, csv, sys, os
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from django.http import HttpResponse, JsonResponse
from django.core.files.base import ContentFile
# from django.contrib.auth.decorators import login_required
from django.db.models import Q

from app.user_methods import is_logged_in, is_admin
from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri, master_dh_query_url, master_repo, rating_table, recsys_table
from app.user_methods import createAdminUser, updateAdminUserWithNewTokens, createEndUser, makeRequest, makeGetRequest
from app.global_vars import required_recsys_params, default_recsys_template, recsys_param_format, SPARK_HOME, SERVER_HOME, SOLR_SETTINGS, KIBITZ_TABLE_MARKER
from app.methods import getItemTableFormat, makeOrUpdateRating, removeRating, makeNotInterested, removeNotInterested, makeSolrRequest, prepare_file_solr, prepare_file_datahub, fetch_csv_from_datahub
from app.system_methods import createSessionForUser, getUniqueDictList, lock_decorator, properStringForQuery, whereInClauseQuery
from app.models import Rating, NotInterested

from authentication.models import Account
from recsys.models import Recsys
from recsys.methods import checkRecsysUrlUnique, checkUrlFormat, formatUrl, formatTableName

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
        if not checkUrlFormat(urlName):
            return Response({
                'status': 'url_error',
                'message': 'Url format has error'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = Account.objects.get(username=username)
        owner_id = user.id 
        selected_csv_headers = json.loads(data.get("headers")) # dict of {'title': title_field, 'description': description_field, ..}
        
        repo_base = username
        repo_name = 'kibitz' #NOTE: CSV upload tables stored in repo named 'kibitz'
        item_table_name = formatTableName(urlName)
        solr_core_name = formatUrl(urlName)

        # create repo for item table. if kibitz repo exists, do nothing
        api_url = '/api/v1/repos/{}'.format(username)
        r = makeRequest('POST', api_url, owner_id, data={'repo_base': repo_base, 'repo_name': repo_name})

        # upload CSV file to DH
        file = data.get('file')
        file_url_dh, file_name, headers = prepare_file_datahub(file)
        api_url = '/api/v1/repos/{}/{}/files'.format(repo_base, repo_name)
        r = makeRequest('POST', api_url, owner_id, files={'file': open(file_url_dh,'rb')})

        # create table from DH CSV file
        api_url = '/api/v1/repos/{}/{}/tables'.format(repo_base, repo_name)
        r = makeRequest('POST', api_url, owner_id, data={
            'table_name': item_table_name,
            'from_file': file_name,
            'delimiter': ',',
            'quote_character': '\"',
            'has_header': 'true'
        })
        
        # prepare file for solr indexing
        file_url_solr = prepare_file_solr(file, file_url_dh)
         
        # setup solr core and index       
        output = subprocess.check_output(['/var/www/html/kibitz/server/scripts/solr_setup.sh', '-c', solr_core_name, '-f', '{}'.format(file_url_solr)]) 
        print output

        # create recsys object
        recsys = Recsys(name=recommenderName, url_name=urlName, repo_base=repo_base, repo_name=repo_name, item_table_name=item_table_name)
        recsys.primary_key_field = 'id'
        
        param_dict = {'title':'title_field','description':'description_field', 'image':'image_link_field', 'univ_code': 'universal_code_field'}
        for param in param_dict.keys():
            param_val = selected_csv_headers.get(param,'')
            if param_val != '':
                setattr(recsys, param_dict.get(param), headers[int(param_val)])
            else:
                setattr(recsys, param_dict.get(param), '')
              
        recsys.template = json.dumps(default_recsys_template)
        recsys.solr_core_name = solr_core_name
        recsys.status = 'paused'
        recsys.owner = user
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
        repo_name = 'kibitz' #NOTE: CSV upload tables stored in repo named 'kibitz'
        item_table_name = formatTableName(urlName)
        solr_core_name = formatUrl(urlName)

        required_headers = json.loads(data.get("headers")) # dict of {'title': title_field, 'description': description_field, ..}

        # create repo for item table. if kibitz repo exists, do nothing
        api_url = '/api/v1/repos/{}'.format(username)
        r = makeRequest('POST', api_url, owner_id, data={'repo_base': repo_base, 'repo_name': repo_name})

        # upload CSV file to DH
        file = data.get('file')
        file_url_dh, file_name, headers = prepare_file_datahub(file)
        api_url = '/api/v1/repos/{}/{}/files'.format(repo_base, repo_name)
        r = makeRequest('POST', api_url, owner_id, files={'file': open(file_url_dh,'rb')})

        # create table from DH CSV file
        api_url = '/api/v1/repos/{}/{}/tables'.format(repo_base, repo_name)
        r = makeRequest('POST', api_url, owner_id, data={
            'table_name': item_table_name,
            'from_file': file_name,
            'delimiter': ',',
            'quote_character': '\"',
            'has_header': 'true'
        })

        if r.status_code == 400:
            api_url = '/api/v1/repos/{}/{}/tables/{}/'.format(repo_base, repo_name, item_table_name)
            r = makeDeleteRequest(api_url, owner_id)
            api_url = '/api/v1/repos/{}/{}/tables'.format(repo_base, repo_name)
            r = makeRequest('POST', api_url, owner_id, data={
                'table_name': item_table_name,
                'from_file': file_name,
                'delimiter': ',',
                'quote_character': '\"',
                'has_header': 'true'
            }) 

        # prepare file for solr indexing
        file_url_solr = handle_uploaded_file(file)
        
        # resetup solr index       
        output = subprocess.check_output(['/var/www/html/kibitz/server/scripts/solr_update_index.sh', '-c', solr_core_name, '-f', '{}'.format(file_url_solr)]) 

        recsys = Recsys.objects.get(id=recsys_id) 
        recsys.primary_key_field = 'id'
        recsys.repo_name = repo_name
        recsys.item_table_name = item_table_name 

        param_dict = {'title':'title_field','description':'description_field', 'image':'image_link_field', 'univ_code': 'universal_code_field'}
        for param in param_dict.keys():
            param_val = selected_csv_headers.get(param,'')
            if param_val != '':
                setattr(recsys, param_dict.get(param), headers[int(param_val)])
            else:
                setattr(recsys, param_dict.get(param), '')

        recsys.solr_core_name = solr_core_name
        recsys.status = 'paused'
        recsys.save()

        return HttpResponse("done") 

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
        api_url = '/api/v1/repos' #'/{}'.format(username)
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
        primary_key_field = recsys.primary_key_field

        if len(item_ids) != 0:
            api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
            query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
            query += whereInClauseQuery(primary_key_field, item_ids, False)
            query += "order by cast({} as int) asc;".format(primary_key_field)
    
            r = makeRequest('POST', api_url, owner_id, query=query)
            print r.content
            if r.status_code == 200:
                items = r.json()['rows']
                return JsonResponse({'items':items})
        else:
            return JsonResponse({'items':[]})
             
        return HttpResponse("status:", r.status_code)

class ItemPagingView(views.APIView): # TODO: allow non-logged in users to get items (give most popular items)
    
    @is_logged_in
    def get(self, request, pk=None, format=None): # list get
        username = request.user.username
        user_id = request.user.id
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        owner_id = recsys.owner_id
        repo_base = recsys.repo_base
        universal_code_field = recsys.universal_code_field
        primary_key_field = recsys.primary_key_field
        current_page = request.query_params.get('current_page')        
        rows_per_page = request.query_params.get('rows_per_page')        
        sorted_by = request.query_params.get('sorted_by')
        sorted_order = request.query_params.get('sorted_order')
        filter_by = request.query_params.get('filter_by') # TODO: convert to a list of items

        # exclude not interested items
        item_metas = NotInterested.objects.filter(user_id=user_id) # get not interested items across all recsys
        item_ids = [str(meta.item_id) for meta in item_metas if str(meta.recsys_id) == recsys_id] # filter not interested items for current recsys
        univ_codes = [str(meta.universal_code) for meta in item_metas if meta.universal_code != None]

        api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
        query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
        query += whereInClauseQuery(primary_key_field, item_ids, True, universal_code_field, univ_codes, True)
        if sorted_by != None:
            query += "order by cast({} as float) {};".format(sorted_by, sorted_order)
        else:
            query += "order by cast({} as int) asc;".format(primary_key_field)
        print query

        return_dict = {
            'items':[]
        }
        payload = {
            'current_page': current_page,
            'rows_per_page': rows_per_page,
        }
        r = makeRequest('POST', api_url, owner_id, query=query, data=payload)
        if r.status_code == 200:
            print r.content
            rows = r.json()['rows']
            if len(rows) != 0:
                return_dict['items'] = r.json()['rows']
                print rows, r.status_code, r.content
            else :
                return JsonResponse({'response':r.json(), 'message':'No more rows', 'done':True})
        else:
            #print r.json(), r.content, r.status_code
            return HttpResponse("failed to get items")    
   
 
        # Attach rating distribution for each item
        return_dict['items'] = attachRatingDist(return_dict['items'], universal_code_field, primary_key_field)

        # TODO: sort by highest rating. later, sort by combination of most ratings and highest. i
        # attach rating count to item table. update rating count on item rate

        return JsonResponse(return_dict)

def attachRatingDist(items, universal_code_field, primary_key_field):
    print 'ITEMS', items, len(items)
    for item in items:
        item_ratings = Rating.objects.filter(Q(item_id=int(item.get(primary_key_field))) | Q(universal_code=item.get(universal_code_field))) # NOTE: get ratings across recsys
        print "RATINGS", item_ratings, len(item_ratings)
        total_rating_count = len(item_ratings)
        distribution_count = {1:0, 2:0, 3:0, 4:0, 5:0}
        distribution_percentage = {1:0, 2:0, 3:0, 4:0, 5:0}
        total_score = 0
        if total_rating_count != 0:
            for rating in item_ratings:
                r_val = rating.rating
                total_score += r_val
                distribution_count[r_val] = distribution_count.get(r_val) + 1
            item['overall_rating'] = total_score / float(total_rating_count)
            for k in distribution_percentage.keys():
                distribution_percentage[k] = distribution_count.get(k) / float(total_rating_count)
        item['total_rating_count'] = total_rating_count
        item['distribution_count'] = distribution_count
        item['distribution_percentage'] = distribution_percentage

    return items


class ItemView(views.APIView): 

    @is_logged_in
    def get(self, request, pk=None, format=None): # list and individual get
        username = request.user.username
        user_id = request.user.id
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        owner_id = recsys.owner_id
        repo_base = recsys.repo_base
        primary_key_field = recsys.primary_key_field
        universal_code_field = recsys.universal_code_field
        getFirst = request.query_params.get('get_first')

        if getFirst == 'true':
            api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
            query = "select * from {}.{} limit 1".format(recsys.repo_name, recsys.item_table_name)
            r = makeRequest('POST', api_url, owner_id, query=query)
            if r.status_code == 200:
                return JsonResponse({'item':r.json()['rows'][0]})
            else:
                return HttpResponse("failed to get item")
 
        if pk != None: 
            # get single item
            api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
            query = "select * from {}.{} where {}='{}'".format(recsys.repo_name, recsys.item_table_name, primary_key_field, pk)
            r = makeRequest('POST', api_url, owner_id, query=query)
            if r.status_code == 200:
                return JsonResponse({'item':r.json()['rows'][0]})
            else:
                return HttpResponse("failed to get item")

        return_dict = {
            'rated_items':[],
            'recommended_items':[]
        }

        # STEP 1: get rated items. attach my ratings
        if username != None:
            user = Account.objects.get(username=username) #getUserBy('username', username, recsys_id)
            user_ratings = Rating.objects.filter(user=user) #r.json()['rows'] # TODO: give user id or user object???
            ratings_dict = {rating.item_id: rating.rating for rating in user_ratings}
            rated_items = []

            # get user's rated items which belong to given recsys
            recsys_rated_item_ids = tuple([str(rating.item_id) for rating in user_ratings if rating.recsys_id == int(recsys_id)])
            if len(recsys_rated_item_ids) != 0:
                api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
                query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
                query += whereInClauseQuery(primary_key_field, recsys_rated_item_ids, False)
                r = makeRequest('POST', api_url, owner_id, query=query)
                print r.content
                if r.status_code == 200:
                    rated_items.extend(r.json()['rows'])

            # get rated items across different recsys but also found in given recsys
            all_rated_item_codes = tuple([str(rating.universal_code) for rating in user_ratings if rating.universal_code != None])
            if len(all_rated_item_codes) != 0:
                 api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
                 query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
                 query += whereInClauseQuery(universal_code_field, all_rated_item_codes, False)
                 r = makeRequest('POST', api_url, owner_id, query=query)
                 print r.content
                 if r.status_code == 200:
                     rated_items.extend(r.json()['rows'])

            my_rated_items = getUniqueDictList(rated_items, recsys.primary_key_field)

            for item in my_rated_items:
                rating = ratings_dict[int(item.get('id'))]
                item['my_rating'] = rating
            return_dict['rated_items'] = attachRatingDist(my_rated_items, universal_code_field, primary_key_field)


        # STEP 2: Get recommended items
            if len(user_ratings) != 0:
                output = subprocess.check_output([SPARK_HOME+'/bin/spark-submit',SERVER_HOME+'/recommender.py', str(recsys_id), str(user.id), '100'])#, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) # use Popen to debug
		#returncode = output.wait()
		#print('ping returned {0}'.format(returncode))
		#out = output.stdout.read()
		#print(out)
		print "recommender out: ", output
	        #print type(out)
	 	#print ast.literal_eval(out)
                recommended_items = []
                rec_ratings = ast.literal_eval(output)

		if len(rec_ratings) != 0:
			rec_rating_dict = {}
			for rating in rec_ratings:
			    rec_rating_dict[rating.get('item_id')] = rating.get('rating')
			recommended_item_ids = tuple([str(rating.get('item_id')) for rating in rec_ratings])
	                api_url = '/api/v1/query/{}/{}'.format(repo_base, recsys.repo_name)
                        query = "select * from {}.{} ".format(recsys.repo_name, recsys.item_table_name)
                        query += whereInClauseQuery(primary_key_field, recommended_item_ids, False)
                        r = makeRequest('POST', api_url, owner_id, query=query)
                        if r.status_code == 200:
                            recommended_items = r.json()['rows']

                        for item in recommended_items:
			    item['suggested_rating'] = str(rec_rating_dict.get(int(item['id'])))
			recommended_items = sorted(recommended_items, key=lambda x: float(x.get('suggested_rating')), reverse=True) # get top 100 recommendations
                        recommended_items = filter(lambda x: float(x.get('suggested_rating')) >= 1, recommended_items) # NOTE: filter out negative and zero ratings
                else:
			recommended_items = []
		return_dict['recommended_items'] = attachRatingDist(recommended_items, universal_code_field, primary_key_field)

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
        univ_code = request.data.get('univ_code')
        makeOrUpdateRating(username, item_id, rating, recsys_id, universal_code=univ_code)
        #updateItemRating(item_id, recsys_id)
        return HttpResponse("rating done")

    def put(self, request, pk=None, format=None):
        pass

    @is_logged_in
    def delete(self, request, pk=None, format=None): # remove rating
        username = request.user.username 
        item_id = request.data.get('item_id')
        rating = request.data.get('rating')
        recsys_id = request.data.get('recsys_id')
        univ_code = request.data.get('univ_code')
        removeRating(username, item_id, rating, recsys_id, universal_code=univ_code)
        #updateItemRating(item_id, recsys_id)
        return HttpResponse("delete rating done")

class NotInterestedView(views.APIView):

    def get(self, request, pk=None, format=None):
        return JsonResponse(request.user)

    @is_logged_in
    def post(self, request, pk=None, format=None): # make not interested for logged in user
        username = request.user.username 
        item_id = request.data.get('item_id')
        recsys_id = request.data.get('recsys_id')
        univ_code = request.data.get('univ_code')
        makeNotInterested(username, item_id, recsys_id, universal_code=univ_code)
        return HttpResponse("not interested done")

    def put(self, request, pk=None, format=None):
        pass

    @is_logged_in
    def delete(self, request, pk=None, format=None): # remove not interested for logged in user
        username = request.user.username
        item_id = request.data.get('item_id')
        recsys_id = request.data.get('recsys_id')
        univ_code = request.data.get('univ_code')
        removeNotInterested(username, item_id, recsys_id, universal_code=univ_code)
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

class TextSearchView(views.APIView):

    def get(self, request, pk=None, format=None):
        '''
           query params
           port: defaults to 8983
           q: search text
           rows: number of items per search
           start: index of paging. zero-index.
        '''
        port = SOLR_SETTINGS.get('port')
        recsys_id = request.query_params.get('recsys_id')
        recsys = Recsys.objects.get(id=recsys_id)
        core_instance_name = recsys.solr_core_name
        searchText = request.query_params.get('q') + '~0.75' # NOTE: add fuzzy search and threshold
        rows = request.query_params.get('rows')
        start = request.query_params.get('start')
        resp = makeSolrRequest(port, core_instance_name, searchText, rows, start)
        if resp[0] == 200:     
            return JsonResponse(resp[1]) 
        else:
           print resp
           return Response({
               'status': 'text search failed',
               'message': 'Text search failed'
           }, status=status.HTTP_400_BAD_REQUEST)
 
    def post(self, request, pk=None, format=None):
        pass 

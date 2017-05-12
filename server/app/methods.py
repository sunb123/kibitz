import requests, os, subprocess, sys, json, StringIO, csv
from app.user_methods import makeRequest, makeGetRequest
from app.user_methods import master_dh_query_url, master_repo, rating_table
from recsys.models import Recsys
from authentication.models import Account
from app.models import Rating, NotInterested
from app.global_vars import TMP_FILES
from app.system_methods import is_isbn

csv.field_size_limit(sys.maxsize)

def getItemTableFormat(params):
    field_list = []
    for param in params:
        field_list.append( {"column_name": param, "data_type":"text"} )
    if 'id' not in params:
        field_list.insert(0, {"column_name": "id", "data_type":"text"})
    #if 'overall_rating' not in params:
    #    field_list.append( {"column_name": "overall_rating", "data_type":"text"} )
    return str(field_list)

#TODO:
# if recsys created without universal code and then updated to include it
# case: one user create two different ratings for same item. Same item seesn as diff between diff recsys
# merge item rating when universal code is added for both recsys
# 
# update rating objects when universal code field changes for a recsys
#  

def makeOrUpdateRating(username, item_id, rating, recsys_id, universal_code=None):
    user_id = Account.objects.get(username=username).id
    ratingObj = None
    if universal_code != None and universal_code != '':
        ratingObj = Rating.objects.filter(user_id=user_id, universal_code=universal_code).first()
    if ratingObj == None:
        ratingObj = Rating.objects.filter(user_id=user_id, recsys_id=recsys_id, item_id=item_id).first()

    if ratingObj == None:
        user = Account.objects.get(username=username)
        ratingObj = Rating(item_id=item_id, recsys_id=recsys_id, rating=rating, universal_code=universal_code, user=user)
        ratingObj.save()
    else:
        ratingObj.rating = rating
        ratingObj.save()

    return ratingObj

def removeRating(username, item_id, rating, recsys_id, universal_code=None):
    user_id = Account.objects.get(username=username).id
    ratingObj = None
    if universal_code != None and universal_code != '':
       deleteResp = Rating.objects.filter(user_id=user_id, universal_code=universal_code).delete()
       if deleteResp[0] != 0:
           return "ratings deleted"
    # check for ratings created before universal code set 
    ratingObj = Rating.objects.filter(user_id=user_id, recsys_id=recsys_id, item_id=item_id).first()

    if ratingObj != None:
        ratingObj.delete()
        return "rating deleted"
    else:
        raise Exception("rating object not found")

#def updateItemRating(item_id, recsys_id):
#    recsys = Recsys.objects.get(id=recsys_id)
#    owner_id = recsys.owner_id
#    repo_base = recsys.repo_base
#    repo = recsys.repo_name
#    item_repo = recsys.item_table_name
#
#    ratings = Rating.objects.filter(item_id=item_id, recsys_id=recsys_id) # overall rating among admin's own site ratings. TODO: use ratings on items across diff recsys
#
#    total_rating = 0 # TODO: use floats later for partial ratings
#    if len(ratings) > 0:
#        for rating in ratings:
#            total_rating += rating.rating
#        overall_rating = total_rating / len(ratings)
#    else:
#        overall_rating = 0
#
#    api_url = '/api/v1/query/{}/{}'.format(repo_base, repo) # admin username,
#    query = "update {}.{} set overall_rating='{}' where id='{}';".format(repo, item_repo, overall_rating, item_id)
#    resp = makeRequest('POST', api_url, owner_id, query=query)
#    return resp

def makeNotInterested(username, item_id, recsys_id, universal_code=None):
    user_id = Account.objects.get(username=username).id
    interestObj = None
    if universal_code != None and universal_code != '':
        interestObj = NotInterested.objects.filter(user_id=user_id, universal_code=universal_code).first()
    if interestObj == None:
        interestObj = NotInterested.objects.filter(user_id=user_id, recsys_id=recsys_id, item_id=item_id).first()

    if interestObj == None:
        user = Account.objects.get(username=username)
        interestObj = NotInterested(item_id=item_id, recsys_id=recsys_id, universal_code=universal_code, user=user)
        interestObj.save()
    return interestObj 

def removeNotInterested(username, item_id, recsys_id, universal_code=None):
    user_id = Account.objects.get(username=username).id
    interestObj = None
    if universal_code != None and universal_code != '':
        deleteResp = NotInterested.objects.filter(user_id=user_id, universal_code=universal_code).delete()
        if deleteResp[0] != 0:
            return "not interested deleted"

    # check for not interested created before universal code set 
    interestObj = NotInterested.objects.filter(user_id=user_id, recsys_id=recsys_id, item_id=item_id).first()

    if interestObj != None:
        interestObj.delete()
        return "not interested obj deleted"
    else:
        raise Exception("not interested object not found")

# def retrieveRatings(user_id, recsys_id):
#     # TODO: look at items table of recsys.
#     # if user rating matches either universal_code or recsys_id, then return it
#     pass

# check if item ISBN matches an ISBN in admin collection

def importRatingsFromGoodreads():
    # TODO:
    pass
def prepare_file_solr(f, file_url_dh): # NOTE: called after prepare_file_datahub
    original_file_name = str(f).rsplit('.',1)[0].replace(" ","") # remove spaces from file name
    file_name_solr = original_file_name + '_solr32271.csv'
    file_url_solr = os.path.join(TMP_FILES, '{}'.format(file_name_solr)) 
    f = open(file_url_dh, 'r')
    reader = csv.reader(f, delimiter=',')
    headers = [header+'_t' if header != 'id' else header for header in reader.next()] #NOTE:add _t type for solr
    with open(file_url_solr, 'wb+') as destination:
        writer = csv.writer(destination)
        writer.writerow(headers)
        writer.writerows(reader)
    return file_url_solr

def prepare_file_datahub(f):
    original_file_name = str(f).rsplit('.',1)[0].replace(" ","") # remove spaces from file name
    file_name_dh = original_file_name + '_datahub32271.csv'
    file_url = os.path.join(TMP_FILES, '{}'.format(file_name_dh))
    reader = csv.reader(f, delimiter=',')
    headers = [header.strip().lower() for header in reader.next()]
    original_headers = headers[:]
    no_id = False
    if 'id' not in headers:
        no_id = True
        headers.insert(0,'id')
    with open(file_url, 'wb+') as destination:
        writer = csv.writer(destination)
        writer.writerow(headers)
        count = 1
        for row in reader:
            fields = [field.strip() for field in row]
            if no_id:
                fields.insert(0,str(count)) # add index
            writer.writerow(fields)
            count += 1
    return file_url, file_name_dh, original_headers

def datahub_table_to_solr_csv(owner_id, repo_base, repo_name, table_name, pk_field, file_name=''):
    api_url = '/api/v1/repos/{}/{}/files/'.format(repo_base, repo_name) # create csv file from DH table
    r = makeRequest('POST', api_url, owner_id, data={
        #'file_name': '',
        'from_table': table_name,
    })

    file_name_dh = table_name + '.CSV' 
    file_name_local = table_name + '.csv'
    api_url = '/api/v1/repos/{}/{}/files/{}'.format(repo_base, repo_name, file_name_dh)
    r = makeGetRequest(api_url, owner_id)
    scsv = r.json() # get csv file text
    
    file_url = os.path.join(TMP_FILES, '{}'.format(file_name_local))
    with open(file_url, 'wb+') as destination:
        f = StringIO.StringIO(scsv)
        reader = csv.reader(f, delimiter=',')
        writer = csv.writer(destination)
        raw_headers = [header.strip().lower() for header in reader.next()]
        headers = [header+'_t' if header != pk_field else header for header in raw_headers] #NOTE:add _t type for solr
        writer.writerow(headers)
        writer.writerows(reader)
    return file_url 

def makeSolrRequest(port, core, searchText, rows, start):
    solr_url = "http://localhost:{}/solr/{}/query".format(port, core)
    payload = {'q':searchText, 'rows':rows, 'start':start}
    r = requests.post(solr_url, data=payload)
    if r.status_code == 200:
        docs = r.json()['response']['docs']
        return r.status_code, r.json()['response']
    else:
        print "search error", r.status_code, r.content
        return r.status_code, r.content

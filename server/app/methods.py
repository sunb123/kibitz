from app.user_methods import makeRequest
from app.user_methods import master_dh_query_url, master_repo, rating_table
from recsys.models import Recsys
from authentication.models import Account
from app.models import Rating

def getItemTableFormat(params):
    field_list = []
    for param in params:
        field_list.append( {"column_name": param, "data_type":"text"} )
    if 'id' not in params:
        field_list.insert(0, {"column_name": "id", "data_type":"text"})
    if 'overall_rating' not in params:
        field_list.append( {"column_name": "overall_rating", "data_type":"text"} )
    return str(field_list)

def makeRating(username, item_id, rating, recsys_id, universal_code=None):
    user_id = Account.objects.get(username=username).id
    if universal_code != None:
        ratingObj = Rating.objects.filter(user_id=user_id, universal_code=universal_code).first()
    else:
        ratingObj = Rating.objects.filter(user_id=user_id, recsys_id=recsys_id, item_id=item_id).first()

    if ratingObj == None:
        user = Account.objects.get(username=username)
        ratingObj = Rating(item_id=item_id, recsys_id=recsys_id, rating=rating, universal_code=universal_code, user=user)
        ratingObj.save()
    else:
        ratingObj.rating = rating
        ratingObj.save()

    return ratingObj

def updateItemRating(item_id, recsys_id):
    recsys = Recsys.objects.get(id=recsys_id)
    owner_id = recsys.owner_id
    repo_base = recsys.repo_base
    repo = recsys.repo_name
    item_repo = recsys.item_table_name

    ratings = Rating.objects.filter(item_id=item_id, recsys_id=recsys_id)

    total_rating = 0 # use floats later for partial ratings
    for rating in ratings:
        total_rating += rating.rating
    overall_rating = total_rating / len(ratings)

    api_url = '/api/v1/query/{}/{}'.format(repo_base, repo) # admin username,
    query = "update {}.{} set overall_rating='{}' where id='{}';".format(repo, item_repo, overall_rating, item_id)
    resp = makeRequest('POST', api_url, owner_id, query=query)
    return resp


# def retrieveRatings(user_id, recsys_id):
#     # TODO: look at items table of recsys.
#     # if user rating matches either universal_code or recsys_id, then return it
#     pass

# check if item ISBN matches an ISBN in admin collection

def importRatingsFromGoodreads():
    # TODO:
    pass

def importRatingsFromAmazon():
    # TODO:
    pass
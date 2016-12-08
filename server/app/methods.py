from app.user_methods import makeRequest, getRecsysRow, getUserBy



def getItemTableFormat(params):
    field_list = []
    for param in params:
        field_list.append( {"column_name": param, "data_type":"text"} )
    field_list.insert(0, {"column_name": "pk_id", "data_type":"text"})
    return str(field_list)

def makeRating(username, item_id, rating, recsys_id):
    user_id = getUserBy('username', username, recsys_id).get('id')

    recsys = getRecsysRow(recsys_id)
    owner_id = int(recsys.get('owner_id'))
    owner = getUserBy('id', owner_id)
    repo_base = owner.get('username')
    repo = recsys.get('repo_name')
    rating_table = recsys.get('rating_table_name')

    api_url = "/api/v1/query/{}/{}".format(repo_base, repo)
    query = "select * from {}.{} where user_id='{}' and item_id='{}' limit 1;".format(repo, rating_table, user_id, item_id)
    resp = makeRequest('POST', api_url, owner_id, query=query)

    if len(resp.json()['rows']) == 0:
        rating_id = '((select count(*) from {}.{})+1)'.format(repo, rating_table)
        query = "insert into {}.{} values ".format(repo, rating_table)
        query += "({}, '{}', '{}', '{}');" \
                    .format(*[rating_id, user_id, item_id, rating])

        resp = makeRequest('POST', api_url, owner_id, query=query)

    else:
        old_rating = resp.json()['rows'][0]
        query = "update {}.{} set rating='{}' where id='{}';".format(repo, rating_table, rating, old_rating.get('id'))
        resp = makeRequest('POST', api_url, owner_id, query=query)

    return resp

def updateItemRating(item_id, recsys_id):
    recsys = getRecsysRow(recsys_id)
    owner_id = int(recsys.get('owner_id'))
    owner = getUserBy('id', owner_id)
    repo_base = owner.get('username')
    repo = recsys.get('repo_name')
    rating_table = recsys.get('rating_table_name')
    item_repo = recsys.get('item_table_name')

    api_url = "/api/v1/query/{}/{}".format(repo_base, repo)
    query = "select * from {}.{} where item_id='{}';".format(repo, rating_table, item_id)

    resp = makeRequest('POST', api_url, owner_id, query=query)
    if resp.status_code == 200:
        ratings = resp.json()['rows']
        total_rating = 0 # use floats later for partial ratings
        for rating in ratings:
            total_rating += int(rating.get('rating'))
        overall_rating = total_rating / len(ratings)

        query = "update {}.{} set overall_rating='{}' where id='{}';".format(repo, item_repo, overall_rating, item_id)
        resp = makeRequest('POST', api_url, owner_id, query=query)
    return resp
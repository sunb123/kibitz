from app.user_methods import makeGetRequest

def checkRecsysParams(params, user):
    pass
    # check name and url unique
    # check repo and table exist

def getRecsysColumnFields():
    api_url = '/api/v1/repos/{}/{}/tables/{}'.format(master_username, 'kibitz', 'recsys')
    resp = makeGetRequest('GET', api_url, 'master')
    columns = map(lambda x: x.get('column_name'), resp.json().get('columns'))
    return columns

    # recsys_params = tuple([request.data.get(column) for column in recsys_columns])

def getDefaultRecsysParams():
    pass

def addRecsysRow():
    pass
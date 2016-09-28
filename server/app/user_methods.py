import requests
from authentication.models import Account
from django.http import HttpResponse
from authentication.models import Account, CustomSession, SessionStore
from rest_framework.response import Response
from rest_framework import status

master_username = 'test321'
master_password = 'kibitzaccount32271'
master_email = 'brian.sun41@gmail.com'

pw_client_id = 'y8Mbupixl7N0oxFlvaDAhnvM1B8ybPxS336jsAtr'
pw_client_secret = 'BrKG0MxCfeGIltywbZpmWgBAuIYcMFeqGfnyyL1dV0TUfz7R1MvGjWc4yqSKtB1N4UM5Cy1MXQmr76EYX1mFcBDwwgrd1kTFuWpfHeSRGYjKap8IMn4bw5PpJYktGpON'

auth_client_id = 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe'
auth_client_secret = 'd2xGNJXRhM9e7jVPSng5tdk3zYv3jTgSRy4hdZiJ3oVAzyIV9TGXQEsQ1j78sDJdrsdyx2TMCaQpWHtjfKVnV8OBG0F5JVd0S5xTyPiYI2tluQXkDfHAIaG0EG0lOd3O'

base_url = 'https://datahub.csail.mit.edu'
redirect_uri = 'http://localhost:3000'

# TODO: abstract out repo names and api urls
# TODO: add proper logging and error handling
# TODO: edge case -- user creates DH account through app, changes email/pw on DH account. need to update master DH

def is_logged_in(func):

    def new_func(self, request, **kwargs): # return the modified func
        username, sessionid, recsys_id = request.data.get('username'), request.data.get('sessionid'), request.data.get('recsys_id',0)
        s = CustomSession.objects.filter(session_key=sessionid).first()
        # print username, sessionid, recsys_id
        if s != None and username == s.username and recsys_id == s.recsys_id:
            # print "logged in {} at recsys {}".format(username, recsys_id)
            return func(self, request, **kwargs)
        else:
            # print "not logged in" # TODO: return not logged in error
            return func(self, request, **kwargs)

    return new_func


def is_authorized():
    pass

def createEndUser(username, email, password):
    # TODO
    pass

def createEndUserFromDatahub(username, email, password):
    # TODO
    pass

def createAdminUser(username, email, password):
    # TODO: check such a DH user exists
    unique = checkAdminUserUnique(username, email)
    if unique == False:
        return 'FAIL admin user creation'

    api_url= '/api/v1/user'
    data = {
        'username': username,
        'email': email,
        'password': password,
    }
    resp = makeRequest('POST', api_url, 'master', data=data) # create DH account
    if resp.status_code != 200:
        return resp
    else: # create user row in master DH account, with tokens.
        access_token, refresh_token = getTokensFromPassword(username, password)
        user_id = '((select count(*) from kibitz.user)+1)'
        api_url = '/api/v1/query/test321/kibitz'
        query = "insert into kibitz.user values ({}, '{}', '{}', '{}', '{}', '{}', '{}');" \
                    .format(*[user_id, username, email, password, 'admin', access_token, refresh_token])
        resp = makeRequest('POST', api_url, 'master', query=query)
        return resp

# def createAdminUserFromDatahub(username):
#     # TODO: check such a DH user exists. use master account to create DH user. if fail, then user exists.
#     unique = checkAdminUserUnique(username) # check for duplicate admin user rows
#     if unique == False:
#         print unique
#         # return Response({},status=status.HTTP_409_CONFLICT)
#         # return Response({
#         #     'status': 'Duplicate account',
#         #     'message': 'Account with username/email already exists.'
#         # }, status=status.HTTP_409_CONFLICT)
#     user_id = '((select count(*) from kibitz.user)+1)'
#     api_url = '/api/v1/query/test321/kibitz'
#     query = "insert into kibitz.user values ({}, '{}', '{}', '{}', '{}', '{}', '{}');" \
#                 .format(*[user_id, username, '', '', 'admin', '', ''])
#     resp = makeRequest('POST', api_url, 'master', query=query)
#     return resp

def checkAdminUserUnique(username, email=None):
    if email == None:
        return getUserBy('username', username) == None
    else:
        return getUserBy('username', username) == None and getUserBy('email', email) == None

def checkEndUserUnique(username, email=None):
    pass

def updateEndUser(username, params):
    pass

def createAdminUserRow(username):
    print
    user_id = '((select count(*) from kibitz.user)+1)'
    api_url = '/api/v1/query/test321/kibitz'
    query = "insert into kibitz.user values ({}, '{}', '{}', '{}', '{}', '{}', '{}');" \
                .format(*[user_id, username, '', '', 'admin', '', ''])
    print query
    resp = makeRequest('POST', api_url, 'master', query=query)
    return resp


def updateAdminUserRow(params, user_id=None, username=None):
    if user_id != None:
        param_type, param = 'id', user_id
    elif username != None:
        param_type, param = 'username', username
    else:
        return "no valid identifying param"

    query = "update kibitz.user set "
    for field, value in params.iteritems():
        query += "{}='{}', ".format(field, value)
    query = query[:-2] + " where {}='{}';".format(param_type, param)
    r = makeRequest('POST', '/api/v1/query/test321/kibitz', 'master', query=query)

    # If user doesn't exist, create it.
    return r

def getUserIdFromUsername(username, recsys_id=0):
    user = getUserBy('username', username, recsys_id)
    if user != None:
        return user.get('id')

def getUserBy(param_type, param, recsys_id=0):
    if recsys_id == 0: # get admin user
        query = "select * from kibitz.user where {}='{}' order by id asc;".format(param_type, param)
        api_url= '/api/v1/query/test321/kibitz'
        # print "getting user", param
        resp = makeRequest('POST', api_url, 'master', query=query)
        # print resp.json()
        if resp.status_code == 200 and len(resp.json()['rows']) == 1:
            return resp.json()['rows'][0]
    else: # get end user
        query = "select * from kibitz.recsys where {}='{}' order by id asc;".format('id', recsys_id)
        api_url= '/api/v1/query/test321/kibitz'
        resp = makeRequest('POST', api_url, 'master', query=query) # find recsys of user
        if resp.status_code == 200 and len(resp.json()['rows']) == 1:
            recsys = resp.json()['rows'][0]
        else:
            return None
        owner_id = recsys.get('owner_id')
        admin = getUserBy('id', owner_id)
        repo_name = recsys.get('repo_name')
        user_table_name = recsys.get('user_table_name')
        query = "select * from {}.{} where {}='{}' order by id asc;".format(repo_name, user_table_name, param_type, param)
        resp = makeRequest('POST', api_url, admin.get('id'), query=query)
        if len(resp.json()['rows']) == 1:
            return resp.json()['rows'][0]
        else:
            return None

def createSessionForUser(username, recsys_id=0):
    session = CustomSession.objects.filter(username=username).first()
    if session == None:
        # print 'create session'
        store = SessionStore()
        store['username'] = username
        store['recsys_id'] = recsys_id
        store.create()
        return CustomSession.objects.filter(pk=store.session_key).first()
    return session

######
def makeGetRequest(method, url, user_id):
    if user_id == 'master': # request to master DH
        access_token = masterAccessToken()
        resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
        if resp.status_code == 401: # token expired. TODO: check return message.
            access_token = refreshMasterToken()
            resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
        return resp
    else: # request to admin DH
        access_token, refresh_token = getAdminUserTokens(user_id)
        if access_token == '':
            return "FAIL no access token"
        resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
        if resp.status_code == 401: # token expired. TODO: check return message.
            access_token = refreshAdminToken(refresh_token, user_id)
            resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
        return resp

def makeRequest(method, url, user_id, query='', data={}): # make request to master DH account
    if method != 'POST':
        return 'Method must be POST'
    payload = {'query': query, 'format': 'json',}
    if user_id == 'master': # request to master DH
        access_token = masterAccessToken()
        payload.update(data)
        resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        if resp.status_code == 401: # token expired. TODO: check return message.
            access_token = refreshMasterToken()
            resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        return resp
    else: # request to admin DH
        access_token, refresh_token = getAdminUserTokens(user_id)
        payload.update(data)
        if access_token == '':
            return "FAIL no access token"
        resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        if resp.status_code == 401: # token expired. TODO: check return message.
            access_token = refreshAdminToken(refresh_token, user_id)
            resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        return resp

def getAdminUserTokens(user_id): # get tokens stored in DH
    user = getUserBy('id', user_id)
    if user != None:
        return user.get('access_token'), user.get('refresh_token')
    return '',''

def masterAccessToken():
    account = Account.objects.filter(username='master').first()
    if account == None:
        print "No master found"
        access_token, refresh_token = createMasterUserWithTokens()
    else:
        print "Master found"
        access_token, refresh_token = account.access_token, account.refresh_token
    return access_token

def createMasterUserWithTokens():
    access_token, refresh_token = getTokensFromPassword(master_username, master_password)
    Account.objects.create_superuser(master_email,master_password,username='master',
        access_token=access_token,refresh_token=refresh_token)
    return access_token, refresh_token

def getTokensFromPassword(username, password):
    token_url = '{}/oauth2/token/'.format(base_url)
    response = requests.post(token_url, data={
        'grant_type': 'password',
        'client_id': pw_client_id,
        'client_secret': pw_client_secret,
        'username': username,
        'password': password,
        })
    return response.json()['access_token'], response.json()['refresh_token']

def refreshAdminToken(refresh_token, user_id):
    access_token, refresh_token = callRefreshToken(refresh_token, user_id)
    params = {'access_token':access_token, 'refresh_token':refresh_token}
    update_success = updateAdminUser(params, user_id=user_id)
    if update_success:
        print 'updated'
    else:
        print 'update failed'
    return access_token

def refreshMasterToken():
    account = Account.objects.get(username='master')
    new_access_token, new_refresh_token = callRefreshToken(account.refresh_token, 'master')
    account.access_token = new_access_token
    account.refresh_token = new_refresh_token
    account.save()
    return new_access_token

def callRefreshToken(refresh_token, user_id):
    if user_id == 'master':
        grant_type = 'password'
    else:
        grant_type = userIsDatahubOrPassword(user_id=user_id)

    if grant_type == 'password':
        client_id = pw_client_id
        client_secret = pw_client_secret
    elif grant_type == 'auth-code':
        client_id = auth_client_id
        client_secret = auth_client_secret

    token_url = '{}/oauth2/token/'.format(base_url)
    response = requests.post(token_url, data={
            'grant_type': 'refresh_token',
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
        })
    return response.json()['access_token'], response.json()['refresh_token']

def userIsDatahubOrPassword(user_id=None, username=None, recsys_id=0):
    if user_id != None:
        user = getUserBy('id', user_id, recsys_id=recsys_id)
    elif username != None:
        user = getUserBy('username', username, recsys_id=recsys_id)
    else:
        return "error. no user id or username given"

    # user = getUserBy('username', username)
    if user.get('password') != None and user.get('password') != '':
        return 'password'
    else:
        return 'datahub'
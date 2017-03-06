import sys
import requests
import threading
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework import status
from authentication.models import Account, CustomSession
from django.db import transaction
from app.system_methods import lock_decorator

##########################
# App Settings
##########################

# NOTE: must have master account with is_superuser=True in authentication_account table

master_username = 'test321'
master_password = 'kibitzaccount32271'
master_email = 'brian.sun41@gmail.com'

master_repo = 'kibitz'
recsys_table = 'recsys'
admin_user_table = 'user'
end_user_table = 'end_user'
rating_table = 'rating'

master_dh_query_url = '/api/v1/query/{}/{}'.format(master_username, master_repo)

pw_client_id = 'y8Mbupixl7N0oxFlvaDAhnvM1B8ybPxS336jsAtr'
pw_client_secret = 'BrKG0MxCfeGIltywbZpmWgBAuIYcMFeqGfnyyL1dV0TUfz7R1MvGjWc4yqSKtB1N4UM5Cy1MXQmr76EYX1mFcBDwwgrd1kTFuWpfHeSRGYjKap8IMn4bw5PpJYktGpON'

auth_client_id = 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe'
auth_client_secret = 'd2xGNJXRhM9e7jVPSng5tdk3zYv3jTgSRy4hdZiJ3oVAzyIV9TGXQEsQ1j78sDJdrsdyx2TMCaQpWHtjfKVnV8OBG0F5JVd0S5xTyPiYI2tluQXkDfHAIaG0EG0lOd3O'

base_url = 'https://datahub.csail.mit.edu'
redirect_uri = 'http://kibitz2.csail.mit.edu/admin' #'http://localhost:3000' # TODO: change to app location

###########################
###########################

# TODO: add proper logging and error handling, api endpoint and grammar isolation
# TODO: edge case -- admin user creates account (along with DH account) through app, then changes email or pw on DH account.
# need to update master DH admin user row.

def is_logged_in(func):
    def new_func(self, request, **kwargs): # return the modified func
        if request.user.is_authenticated:
            return func(self, request, **kwargs)
        else:
            return Response({
                'status': 'Unauthorized',
                'message': 'Not logged in'
            }, status=status.HTTP_401_UNAUTHORIZED)
    return new_func

def is_admin(func):
    def new_func(self, request, **kwargs): # return the modified func
        if request.user.is_admin:
            return func(self, request, **kwargs)
        else:
            return Response({
                'status': 'Unauthorized',
                'message': 'Not admin'
            }, status=status.HTTP_401_UNAUTHORIZED)
    return new_func

# def is_recsys_owner(func):
#     def new_func(self, request, **kwargs):
#         pass

#     return new_func

# def is_allowed_user(func):
#     def new_func(self, request, **kwargs):
#         pass

#     return new_func

# def is_end_user(func):
#     def new_func(self, request, **kwargs):
#         pass

#     return new_func

@lock_decorator
def updateAdminUserWithNewTokens(username, code):
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
        admin = Account.objects.get(username=username)
        admin.access_token = access_token
        admin.refresh_token = refresh_token
        admin.save()
        return HttpResponse("saved access tokens")
    else:
        return HttpResponse(r.content)

def createEndUser(username, email, password):
    if not checkUserUnique(username):
        return False
    end_user = Account(username=username)
    end_user.set_password(password)
    end_user.save()
    return end_user

def createAdminUser(username, email, password):
    if not checkUserUnique(username, email=email):
        return False

    api_url= '/api/v1/user'
    data = {
        'username': username,
        'email': email,
        'password': password,
    }
    resp = makeRequest('POST', api_url, 0, data=data, isMaster=True) # create DH account
    print resp.content
    if resp.status_code != 200:
        return False
    else: # create new admin object, with tokens.
        return createAdminUserObjectWithTokens(username, email=email, password=password)

def checkUserUnique(username, email=None, recsys_id=None):
    return Account.objects.filter(username=username).first() == None

@lock_decorator
def createAdminUserObjectWithTokens(username, email=None, password=None):
    access_token, refresh_token = getTokensFromPassword(username, password)
    admin_user = createAdminUserObject(username, email=email, password=password, access_token=access_token,
            refresh_token=refresh_token)
    return admin_user

def createAdminUserObject(username, email=None, password=None, access_token=None, refresh_token=None):
    admin_user = Account(username=username, is_admin=True)
    if email != None:
        admin_user.email = email
    if password != None:
        admin_user.set_password(password)
    if access_token != None and refresh_token != None:
        admin_user.access_token = access_token
        admin_user.refresh_token = refresh_token
    admin_user.save()
    return admin_user

################################################
################################################

# if no tokens, check user status.

# if password, then get new tokens by pw
# if auth, then do nothing. user needs to provide tokens by auth code call.

# if tokens fail, then initiate refresh

# if refresh fail, then need to get new tokens.
# do a token reset process


def makeGetRequest(url, user_id):
    access_token = getAdminUserTokens(user_id) # NOTE: makes call to DH to get tokens
    if access_token == None or access_token == '':
        return "FAIL no access token"
    resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
    if resp.status_code == 401: # token expired.
        access_token = refreshAdminToken(user_id)
        resp = requests.get(base_url+url,headers={'Authorization':'Bearer '+access_token})
    return resp

def makeRequest(method, url, user_id, query='', data={}, isMaster=False): # only POST for now
    if method != 'POST':
        return 'Method must be POST'
    payload = {'query': query, 'format': 'json',}

    if isMaster:
        access_token = masterAccessToken()
        payload.update(data)
        resp = requests.post(base_url+url,headers={'Authorization': 'Bearer '+access_token},data=payload)
        if resp.status_code == 401: # token expired.
            access_token = refreshMasterToken()
            resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        return resp
    else: # request to admin DH
        access_token = getAdminUserTokens(user_id) # NOTE: makes call to DH to get tokens
        payload.update(data)
        if access_token == None or access_token == '': # NOTE: auth type user with no tokens
            return "FAIL no access token"
        resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        if resp.status_code == 401: # token expired.
            access_token = refreshAdminToken(user_id)
            resp = requests.post(base_url+url,headers={'Authorization':'Bearer '+access_token},data=payload)
        return resp

@lock_decorator
def masterAccessToken():
    account = Account.objects.get(username='master', is_superuser=True) # master account must exist
    if account.access_token != None and account.access_token != '':
        access_token = account.access_token
    else:
        access_token = setNewMasterTokens()
    return access_token

@lock_decorator
def getAdminUserTokens(user_id):
    user = Account.objects.filter(id=user_id).first()
    if user == None:
        raise Exception("User account not found.")
    elif user.access_token != None and user.access_token != '':
        access_token = user.access_token
    elif getUserAuthType(user_id=user_id) == 'password':
        access_token = setNewAdminTokens(user_id)
    else:
        access_token = None
    return access_token

@lock_decorator
def refreshMasterToken(): # NOTE: this might break with request filelocking
    account = Account.objects.get(username='master', is_superuser=True)
    new_access_token, new_refresh_token = callRefreshToken(account.refresh_token, '', isMaster=True)
    if new_access_token == None:
        new_access_token = setNewMasterTokens()
    else:
        account.access_token = new_access_token
        account.refresh_token = new_refresh_token
        account.save()
    return new_access_token

@lock_decorator
def refreshAdminToken(user_id):
    admin_user = Account.objects.get(id=user_id)
    access_token, refresh_token = callRefreshToken(admin_user.refresh_token, user_id)
    if access_token != None: # refresh succeeded
        admin_user.access_token = access_token
        admin_user.refresh_token = refresh_token
        admin_user.save()
        return access_token
    else:
        raise Exception("Admin user token refresh failed.")

def setNewMasterTokens():
    account = Account.objects.get(username='master', is_superuser=True)
    new_access_token, new_refresh_token = getTokensFromPassword(master_username, master_password)
    account.access_token = new_access_token
    account.refresh_token = new_refresh_token
    account.save()
    return new_access_token

def setNewAdminTokens(user_id):
    account = Account.objects.filter(id=user_id).first()
    new_access_token, new_refresh_token = getTokensFromPassword(account.username, account.password)
    account.access_token = new_access_token
    account.refresh_token = new_refresh_token
    account.save()
    return new_access_token

def getTokensFromPassword(username, password):
    token_url = '{}/oauth2/token/'.format(base_url)
    response = requests.post(token_url, data={
        'grant_type': 'password',
        'client_id': pw_client_id,
        'client_secret': pw_client_secret,
        'username': username,
        'password': password,
        })
    access_token, refresh_token = response.json().get('access_token'), response.json().get('refresh_token')
    if access_token != None and access_token != '' and refresh_token != None and refresh_token != '':
        return access_token, refresh_token
    else:
        raise Exception("Get new auth tokens from password failed.")

def callRefreshToken(refresh_token, user_id, isMaster=False): # returns new tokens
    if isMaster:
        grant_type = 'password'
    else:
        print "called refresh"
        grant_type = getUserAuthType(user_id=user_id)

    if grant_type == 'password':
        client_id = pw_client_id
        client_secret = pw_client_secret
    elif grant_type == 'auth_code':
        client_id = auth_client_id
        client_secret = auth_client_secret

    token_url = '{}/oauth2/token/'.format(base_url)
    response = requests.post(token_url, data={
            'grant_type': 'refresh_token',
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
        })

    print 'called refresh', response.content, user_id, "master", isMaster

    if response.status_code == 200:
        return response.json().get('access_token'), response.json().get('refresh_token')
    else:
        return None, None

def getUserAuthType(user_id=None, username=None, recsys_id=None): # user type password or auth_code
    if user_id != None:
        user = Account.objects.get(id=user_id)
    elif username != None:
        user = Account.objects.get(username=username)
    else:
        return "error. no user id or username given"

    if user.password != None and user.password != '':
        print 'password type'
        return 'password'
    else:
        print 'auth type'
        return 'auth_code'

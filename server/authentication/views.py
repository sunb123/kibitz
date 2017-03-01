import json, requests

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

# from django.views.decorators.csrf import csrf_exempt
# from rest_framework.permissions import IsAuthenticated, AllowAny

from django.http import HttpResponse
from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response

from authentication.permissions import IsAccountOwner
from authentication.models import Account, CustomSession, SessionStore
from authentication.serializers import AccountSerializer

from rest_framework.decorators import detail_route, list_route

from django.http import JsonResponse
from rest_framework.parsers import JSONParser

from app.user_methods import createAdminUserObject, createAdminUser, createEndUser
from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri
from app.system_methods import createSessionForUser, lock_decorator


class LoginView(views.APIView):

    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        adminLogin = request.data.get('is_admin_login')
        try:
            if adminLogin:
                user = Account.objects.filter(username=username, is_admin=True).first()
                if not user:
                    user = Account.objects.get(email=username, is_admin=True) # admin can use email as username
            else:
                user = Account.objects.get(username=username, is_admin=False)
        except Account.DoesNotExist:
            return Response({
                'status': 'Unauthorized',
                'message': 'User not found'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if user.password == None or user.password == '':
            return Response({
                'status': 'Unauthorized',
                'message': 'Login with Datahub only.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
        else:
            return Response({
                'status': 'Unauthorized',
                'message': 'Username or Password incorrect.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        return JsonResponse({'message':'logged in', 'username':username})

class LogoutView(views.APIView):

    # TODO: return error if not authenticated
    def post(self, request, format=None):
        if request.user.is_authenticated():
            logout(request)
            print "got logout", request.user, request.user.is_authenticated()
        else:
            print "user not authenticated"
        return HttpResponse("logged out")

class ProfileCodeLoginView(views.APIView): # login method only for admin users.

    @lock_decorator
    def post(self, request, format=None):
        username = request.data.get('username')
        payload = {
            'code': request.data.get('profile_code'),
            'client_id': auth_client_id,
            'client_secret': auth_client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }
        url = base_url + '/oauth2/token/'
        r = requests.post(url, data=payload)
        access_token = r.json().get('access_token')

        if r.status_code == 200 and access_token != None:
            resp = requests.get(base_url+'/api/v1/user',headers={'Authorization':'Bearer '+access_token})
            profile_username = resp.json().get('username')
            if profile_username != None and profile_username == username:
                user = Account.objects.filter(username=username).first()
                if user == None: # signup by DH called
                    user = createAdminUserObject(username)
                elif not user.is_admin: # end user becomes an admin account. has corresponding DH account.
                    user.is_admin = True
                    user.save()
                u = authenticate(username=username)
                login(request, u)
                return JsonResponse({'message':'logged in', 'username':username})
            else:
                return Response({
                    'status': 'Bad request',
                    'message': 'Get user call failed.'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'status': 'Bad request',
                'message': 'Incorrect profile code.'
            }, status=status.HTTP_400_BAD_REQUEST)

class AdminUserView(views.APIView):

    def get(self, request, pk=None, format=None):
        return HttpResponse("user get "+str(pk))

    def post(self, request, pk=None, format=None): # create
        data = request.data
        user = False
        if data.get('password') != None and data.get('username') != None and data.get('email') != None and data.get('password') != '' and data.get('username') != '' and data.get('email') != '':
            user_params = [data.get('username'), data.get('email'), data.get('password')]
            user = createAdminUser(*user_params) # create DH account
        else:
            return Response({
                'status': 'Bad request',
                'message': 'No username, email, or password given.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user != False:
            return HttpResponse("account created")
        else:
            return Response({
                'status': 'Bad request',
                'message': 'User already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None, format=None): # update
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")

class EndUserView(views.APIView):

    def get(self, request, pk=None, format=None):
        return HttpResponse("user get "+str(pk))

    @lock_decorator
    def post(self, request, pk=None, format=None):
        data = request.data

        if data.get('password') != None and data.get('password') != '' and data.get('username') != None and data.get('username') != '':
            params = [data.get('username'), data.get('email',''), data.get('password')]
            user = createEndUser(*params)
        else:
            return Response({
                'status': 'Bad request',
                'message': 'No username or password given.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user != False:
            return HttpResponse("account created")
        else:
            return Response({
                'status': 'Bad request',
                'message': 'User already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return HttpResponse('failed. no username or password given.')

    def put(self, request, pk=None, format=None):
        return HttpResponse("user put")

    def delete(self, request, pk=None, format=None):
        return HttpResponse("user delete")
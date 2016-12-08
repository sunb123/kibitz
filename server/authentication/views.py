import json
import requests

from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse

from rest_framework import permissions, status, views, viewsets
from rest_framework.response import Response

from authentication.permissions import IsAccountOwner
from authentication.models import Account, CustomSession, SessionStore
from authentication.serializers import AccountSerializer

from rest_framework.decorators import detail_route, list_route

from django.http import JsonResponse
from rest_framework.parsers import JSONParser

from app.user_methods import getUserBy, createSessionForUser, createAdminUserRow
from app.user_methods import masterAccessToken, master_username, master_password, pw_client_id, pw_client_secret, \
auth_client_id, auth_client_secret, base_url, redirect_uri

class AccountViewSet(viewsets.ModelViewSet):
    lookup_field = 'username'
    queryset = Account.objects.all()
    serializer_class = AccountSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return (permissions.AllowAny(),)

        if self.request.method == 'POST':
            return (permissions.AllowAny(),)

        return (permissions.IsAuthenticated(), IsAccountOwner(),)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            Account.objects.create_user(**serializer.validated_data)

            return Response(serializer.validated_data, status=status.HTTP_201_CREATED)
        return Response({
            'status': 'Bad request',
            'message': 'Account could not be created with received data.'
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):

    def post(self, request, format=None):
        username = request.data.get('username', None)
        #email = request.data.get('email', None)
        password = request.data.get('password', None)
        recsys_id = request.data.get('recsys_id', 0)

        print username, password, recsys_id

        user = getUserBy('username', username, recsys_id=recsys_id)

        print user, 'user'

        if user != None:
            if user.get('password') == None or user.get('password') == '':
                return Response({
                    'status': 'Unauthorized',
                    'message': 'User login with Datahub only.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            elif user.get('password') != password:
                return Response({
                    'status': 'Unauthorized',
                    'message': 'Password incorrect.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                'status': 'Not found',
                'message': 'No account with username was found.'
            }, status=status.HTTP_404_NOT_FOUND)

        ## Successfully logged in. Check for session or create session.
        s = createSessionForUser(username, recsys_id=recsys_id)
        return JsonResponse({'message':'logged in', 'sessionid':s.session_key, 'username':username})

class LogoutView(views.APIView):

    def post(self, request, format=None):
        username = request.data.get('username', None)
        sessionid = request.data.get('sessionid', None)

        if sessionid != '' or sessionid != None:
            s = CustomSession.objects.filter(pk=sessionid).first()
            if s != None:
                s.delete()
                print 'deleted session'
                return JsonResponse({"message":"logged out"})
            else:
                print 'no session found'
                return JsonResponse({"message":"already logged out"})
        else:
            return JsonResponse({"message":"no sessioned id provided"})

class ProfileCodeLoginView(views.APIView): # login mehtod only for admin users.

    def post(self, request, format=None):
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
            username = resp.json().get('username')
            user = getUserBy('username', username)
            print user
            if username != None:
                s = createSessionForUser(username)
                if user == None:
                    resp = createAdminUserRow(username)
                    print resp.content
                return JsonResponse({'sessionid':s.session_key, 'username':username})
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


# class EndUserLogin(views.APIView):
#     pass

# class EndUserLogout(views.APIView):
#     pass
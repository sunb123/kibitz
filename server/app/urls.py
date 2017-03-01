from django.conf.urls import include, url
from rest_framework_nested import routers
from authentication.views import LoginView, LogoutView, ProfileCodeLoginView, AdminUserView, EndUserView #, AccountViewSet
from app.views import ItemView, RatingView, CSVUploadView, RepoTableView, AuthCodeToAccessTokenView, \
WidgetTestView , RecsysParamsView # RecommendationView
from recsys.views import RecsysViewSet

router = routers.SimpleRouter()
# router.register(r'accounts', AccountViewSet)
router.register(r'recsys', RecsysViewSet)

# accounts_router = routers.NestedSimpleRouter(
#     router, r'accounts', lookup='account'
# )

urlpatterns = [
    url(r'^api/v1/', include(router.urls)),

    # url(r'^api/v1/', include(accounts_router.urls)),

    url(r'^api/v1/end-user/$', EndUserView.as_view(), name='end-user'),
    url(r'^api/v1/end-user/(?P<pk>[^/]+)/$', EndUserView.as_view(), name='end-user-detail'),

    url(r'^api/v1/admin-user/$', AdminUserView.as_view(), name='admin-user'),
    url(r'^api/v1/admin-user/(?P<pk>[^/]+)/$', AdminUserView.as_view(), name='admin-user-detail'),

    url(r'^api/v1/item/$', ItemView.as_view(), name='items'),
    url(r'^api/v1/item/(?P<pk>[^/]+)/$', ItemView.as_view(), name='items'),

    url(r'^api/v1/rating/$', RatingView.as_view(), name='ratings'),
    url(r'^api/v1/rating/(?P<pk>[^/]+)/$', RatingView.as_view(), name='ratings'),

    # url(r'^api/v1/recommendation/$', RecommendationView.as_view(), name='recommendation'),
    # url(r'^api/v1/recommendation/(?P<pk>[^/]+)/$', RecommendationView.as_view(), name='recommendation'),

    url(r'^api/v1/code-to-token/$', AuthCodeToAccessTokenView.as_view(), name='code-to-token'),

    url(r'^api/v1/profile-code/$', ProfileCodeLoginView.as_view(), name='code-to-token'),

    url(r'^api/v1/repo-table/$', RepoTableView.as_view(), name='repo-table'),

    url(r'^api/v1/csv/$', CSVUploadView.as_view(), name='csv'),

    url(r'^api/v1/auth/login/$', LoginView.as_view(), name='login'),
    url(r'^api/v1/auth/logout/$', LogoutView.as_view(), name='logout'),

    url(r'^api/v1/widget-test/$', WidgetTestView.as_view(), name='widget-test'),

    url(r'^api/v1/recsys-params/$', RecsysParamsView.as_view(), name='recsys-params'),

    #url(r'^$', IndexView.as_view(), name='index'), # later add a url to site or .* to match any URL
]

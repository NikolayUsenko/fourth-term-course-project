from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'lessons', views.LessonViewSet, basename='lesson')
router.register(r'results', views.TestResultViewSet, basename='result')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.user_stats, name='user-stats'),
    path('admin/stats/', views.admin_all_user_stats, name='admin-user-stats'),
]
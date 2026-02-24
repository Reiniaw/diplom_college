from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, 
    DirectorUserViewSet, RegisterAPIView, 
    OrderViewSet, CurrentUserView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'users', DirectorUserViewSet, basename='users')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', RegisterAPIView.as_view(), name='user-register'),
    path('', include(router.urls)),
]
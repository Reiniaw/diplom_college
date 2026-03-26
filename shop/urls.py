from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, 
    DirectorUserViewSet, RegisterAPIView, 
    OrderViewSet, CurrentUserView,
    DirectorStatsView, TechFieldViewSet,
    OrderItemViewSet
)

router = DefaultRouter()
router.register(r'tech-fields', TechFieldViewSet, basename='tech-field')
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'users', DirectorUserViewSet, basename='users')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', RegisterAPIView.as_view(), name='user-register'),
    path('director/stats/', DirectorStatsView.as_view(), name='director-stats'),
    path('', include(router.urls)),
]
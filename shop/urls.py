from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import (
    CategoryViewSet, ProductViewSet,
    DirectorUserViewSet, RegisterAPIView,
    OrderViewSet, CurrentUserView,
    DirectorStatsView, TechFieldViewSet,
    OrderItemViewSet, FavoriteViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'tech-fields', TechFieldViewSet, basename='tech-field')
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'users', DirectorUserViewSet, basename='users')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')
router.register(r'favorites', FavoriteViewSet, basename='favorites')

# Вложенный роутер для отзывов: /api/products/<product_pk>/reviews/
products_router = nested_routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register(r'reviews', ReviewViewSet, basename='product-reviews')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', RegisterAPIView.as_view(), name='user-register'),
    path('director/stats/', DirectorStatsView.as_view(), name='director-stats'),
    path('', include(router.urls)),
    path('', include(products_router.urls)),
]
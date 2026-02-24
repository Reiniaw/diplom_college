from django.contrib.auth import get_user_model
from rest_framework import viewsets, generics, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated

from .models import Category, Product, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, 
    OrderSerializer, AddItemSerializer, 
    UserSerializer, RegisterSerializer
)

User = get_user_model()

# --- ПРАВА ДОСТУПА ---
class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'

class IsStaffOrDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['manager', 'director']

# --- ТОВАРЫ И КАТЕГОРИИ ---
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffOrDirector()]
        return [AllowAny()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffOrDirector()]
        return [AllowAny()]

# --- ПРОФИЛЬ И HR ---
class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class DirectorUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer 
    permission_classes = [IsDirector]

# --- ЗАКАЗЫ ---
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['director', 'manager'] or user.is_superuser:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    @action(detail=True, methods=['post'], url_path='add-item')
    def add_item(self, request, pk=None):
        order = self.get_object()
        ser = AddItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = Product.objects.get(pk=ser.validated_data['product_id'])
        item, created = OrderItem.objects.get_or_create(
            order=order, product=product,
            defaults={'quantity': ser.validated_data['quantity'], 'price': product.price, 'total_price': product.price * ser.validated_data['quantity']}
        )
        if not created:
            item.quantity += ser.validated_data['quantity']
            item.save()
        order.recalc_total()
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['patch'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        PATCH /api/orders/{pk}/change-status/
        body: {"status": "shipped"}
        """
        order = self.get_object()
        
        # Проверяем, что это не обычный клиент
        if request.user.role not in ['manager', 'director', 'seller']:
            return Response({'detail': 'У вас нет прав для смены статуса'}, status=403)
            
        new_status = request.data.get('status')
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        
        return Response({'detail': 'Неверный статус'}, status=400)
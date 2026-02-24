from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from django.contrib.auth.models import User, Group
from rest_framework.permissions import AllowAny, DjangoModelPermissionsOrAnonReadOnly, BasePermission, IsAuthenticated
from rest_framework.serializers import ModelSerializer
from .models import Order, OrderItem, Product
from .serializers import OrderSerializer, OrderItemSerializer, AddItemSerializer



# ViewSets для товаров и категорий
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]


# Регистрация пользователя
class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserRegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Автоматически добавляем пользователя в группу "Обычный пользователь"
        group, created = Group.objects.get_or_create(name="Обычный пользователь")
        user.groups.add(group)
        return user

class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]



class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.groups.filter(name='Директор').exists()

class DirectorUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'groups']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        groups = validated_data.pop('groups', [])
        user = User.objects.create_user(**validated_data)
        user.groups.set(groups)  # присваиваем выбранные группы
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop('groups', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if groups is not None:
            instance.groups.set(groups)
        instance.save()
        return instance


class DirectorUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = DirectorUserSerializer
    permission_classes = [IsDirector]  # теперь доступ только директору

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # директор может видеть все заказы, другие — только свои
        user = self.request.user
        if user.groups.filter(name='Директор').exists() or user.is_superuser:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def perform_create(self, serializer):
        # Создаём пустой заказ-корзину для пользователя
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='add-item')
    def add_item(self, request, pk=None):
        """
        POST /api/orders/{pk}/add-item/
        body: {"product_id": X, "quantity": Y}
        """
        order = self.get_object()
        if order.status != Order.STATUS_CART:
            return Response({'detail':'Order is not in cart state'}, status=400)
        ser = AddItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = Product.objects.get(pk=ser.validated_data['product_id'])
        quantity = ser.validated_data['quantity']
        # create or update OrderItem
        item, created = OrderItem.objects.get_or_create(order=order, product=product,
                                                        defaults={'quantity': quantity, 'price': product.price, 'total_price': product.price * quantity})
        if not created:
            item.quantity += quantity
            item.save()
        order.recalc_total()
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='remove-item')
    def remove_item(self, request, pk=None):
        """
        POST /api/orders/{pk}/remove-item/
        body: {"product_id": X}
        """
        order = self.get_object()
        if order.status != Order.STATUS_CART:
            return Response({'detail':'Order is not in cart state'}, status=400)
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail':'product_id required'}, status=400)
        OrderItem.objects.filter(order=order, product_id=product_id).delete()
        order.recalc_total()
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        """
        POST /api/orders/{pk}/checkout/  — переводит cart -> placed
        """
        order = self.get_object()
        if order.status != Order.STATUS_CART:
            return Response({'detail':'Order cannot be checked out'}, status=400)
        if order.items.count() == 0:
            return Response({'detail':'Cart is empty'}, status=400)
        order.status = Order.STATUS_PLACED
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)
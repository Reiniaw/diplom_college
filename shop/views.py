from django.contrib.auth import get_user_model
from rest_framework import viewsets, generics, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.db.models import F, JSONField

from .models import Category, Product, Order, OrderItem, TechField, ProductImage, ProductTechValue
from .serializers import (
    CategorySerializer, ProductSerializer, 
    OrderSerializer, AddItemSerializer, 
    UserSerializer, RegisterSerializer, TechFieldSerializer,
    OrderItemSerializer, OrderItemUpdateSerializer, UserUpdateSerializer
)

User = get_user_model()

# --- ПРАВА ДОСТУПА ---
class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'

class IsStaff(BasePermission):
    """Проверка, является ли пользователь продавцом, менеджером или директором"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['seller', 'manager', 'director']

class DirectorUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer 
    permission_classes = [IsDirector]

class DirectorStatsView(APIView):
    permission_classes = [IsDirector]

    def get(self, request):
        # 1. Получаем даты из параметров запроса (?date_from=...&date_to=...)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        # 2. Базовый фильтр: только оформленные заказы
        placed_orders = Order.objects.filter(status=Order.STATUS_PLACED)
        order_items = OrderItem.objects.filter(order__status=Order.STATUS_PLACED)

        # 3. Применяем фильтрацию по датам, если они переданы
        if date_from:
            placed_orders = placed_orders.filter(created_at__date__gte=date_from)
            order_items = order_items.filter(order__created_at__date__gte=date_from)
        if date_to:
            placed_orders = placed_orders.filter(created_at__date__lte=date_to)
            order_items = order_items.filter(order__created_at__date__lte=date_to)

        # 4. Общая выручка ЗА ПЕРИОД
        total_sales = placed_orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        # 5. Количество заказов ЗА ПЕРИОД
        orders_count = placed_orders.count()

        # 6. Топ-5 товаров ЗА ПЕРИОД
        top_products = order_items.values(product__name=F('product__name')) \
            .annotate(total_qty=Sum('quantity')) \
            .order_by('-total_qty')[:5]

        # 7. Статистика по дням для таблицы
        daily_stats = placed_orders.annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(
                total=Sum('total_price'),
                count=Count('id')
            ) \
            .order_by('-date')

        # Формируем список для фронтенда
        daily_sales_list = []
        for entry in daily_stats:
            day_items = OrderItem.objects.filter(
                order__status=Order.STATUS_PLACED,
                order__created_at__date=entry['date']
            ).values_list('product__name', flat=True).distinct()[:3]

            daily_sales_list.append({
                "date": entry['date'].strftime('%d.%m.%Y'),
                "total": float(entry['total']),
                "count": entry['count'],
                "items": list(day_items)
            })

        return Response({
            "total_sales": float(total_sales),
            "orders_count": orders_count,
            "top_products": list(top_products),
            "daily_sales": daily_sales_list
        })

class IsStaffOrDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['seller', 'manager', 'director']

# --- ТЕХНИЧЕСКИЕ ПОЛЯ ---
class TechFieldViewSet(viewsets.ModelViewSet):
    queryset = TechField.objects.all()
    serializer_class = TechFieldSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffOrDirector()]
        return [AllowAny()]

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
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'delete_image']:
            return [IsStaffOrDirector()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        images = request.FILES.getlist('images', [])
        
        data = request.data.copy()
        if 'images' in data:
            del data['images']
        
        tech_values_data = {}
        category_id = data.get('category')
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                for tech_field in category.tech_fields.all():
                    if tech_field.key in data:
                        # ФИX: берём первое значение из списка QueryDict
                        raw = data.pop(tech_field.key)
                        tech_values_data[tech_field.id] = raw[0] if isinstance(raw, list) else raw
            except Category.DoesNotExist:
                pass
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        for tech_field_id, value in tech_values_data.items():
            if value:
                ProductTechValue.objects.create(
                    product=product,
                    tech_field_id=tech_field_id,
                    value=value
                )
        
        for image_file in images:
            ProductImage.objects.create(product=product, image=image_file)
        
        return Response(ProductSerializer(product).data, status=201)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        images = request.FILES.getlist('images', [])
        
        data = request.data.copy()
        if 'images' in data:
            del data['images']
        
        tech_values_data = {}
        category_id = data.get('category', instance.category_id)
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                for tech_field in category.tech_fields.all():
                    if tech_field.key in data:
                        # ФИX: берём первое значение из списка QueryDict, избегаем экранирования
                        raw = data.pop(tech_field.key)
                        tech_values_data[tech_field.id] = raw[0] if isinstance(raw, list) else raw
            except Category.DoesNotExist:
                pass
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        for tech_field_id, value in tech_values_data.items():
            tech_value, created = ProductTechValue.objects.get_or_create(
                product=product,
                tech_field_id=tech_field_id,
                defaults={'value': value}
            )
            if not created:
                tech_value.value = value
                tech_value.save()
        
        for image_file in images:
            ProductImage.objects.create(product=product, image=image_file)
        
        return Response(ProductSerializer(product).data)

    # ФИX: новый экшен для удаления конкретного фото
    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """DELETE /api/products/{product_id}/images/{image_id}/ — удаляет одно фото товара"""
        try:
            product = self.get_object()
            image = ProductImage.objects.get(id=image_id, product=product)
            # Удаляем файл с диска
            image.image.delete(save=False)
            image.delete()
            return Response({'detail': 'Фото удалено'}, status=204)
        except ProductImage.DoesNotExist:
            return Response({'detail': 'Фото не найдено'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


# --- ПРОФИЛЬ И HR ---
class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Обновить профиль пользователя"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=400)

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
        if user.role in ['director', 'manager', 'seller']:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    @action(detail=True, methods=['post'], url_path='add-item')
    def add_item(self, request, pk=None):
        order = self.get_object()
        ser = AddItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = Product.objects.get(pk=ser.validated_data['product_id'])
        quantity = ser.validated_data['quantity']
        
        if not product.is_in_stock():
            return Response({'detail': 'Товар нет в наличии'}, status=400)
        
        if product.stock < quantity:
            return Response({'detail': f'Недостаточно товара. Доступно: {product.stock}'}, status=400)
        
        item, created = OrderItem.objects.get_or_create(
            order=order, product=product,
            defaults={'quantity': quantity, 'price': product.price, 'total_price': product.price * quantity}
        )
        if not created:
            if product.stock < item.quantity + quantity:
                return Response({'detail': f'Недостаточно товара. Доступно: {product.stock}'}, status=400)
            item.quantity += quantity
            item.save()
        order.recalc_total()
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['patch'], url_path='change-status')
    def change_status(self, request, pk=None):
        order = self.get_object()
        
        if request.user.role not in ['manager', 'director', 'seller']:
            return Response({'detail': 'У вас нет прав для смены статуса'}, status=403)
            
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'detail': 'Неверный статус'}, status=400)
        
        if order.status == Order.STATUS_PLACED and new_status == Order.STATUS_CANCELLED:
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])
        
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='current-cart')
    def current_cart(self, request):
        order, created = Order.objects.get_or_create(
            user=request.user, 
            status=Order.STATUS_CART,
            defaults={'total_price': 0}
        )
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        order = self.get_object()
        if order.status != Order.STATUS_CART:
            return Response({'detail': 'Order already placed'}, status=400)
        
        for item in order.items.all():
            if not item.product.is_in_stock():
                return Response({'detail': f'Товар "{item.product.name}" нет в наличии'}, status=400)
            if item.product.stock < item.quantity:
                return Response({'detail': f'Недостаточно товара "{item.product.name}". Доступно: {item.product.stock}'}, status=400)
        
        for item in order.items.all():
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])
        
        order.address = request.data.get('address')
        order.phone = request.data.get('phone')
        order.delivery_time = request.data.get('delivery_time')
        order.notes = request.data.get('notes')
        
        order.status = Order.STATUS_PLACED
        order.created_at = timezone.now()
        
        order.save()
        return Response(OrderSerializer(order).data)


# --- УПРАВЛЕНИЕ ТОВАРАМИ В ЗАКАЗЕ ---
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return OrderItemSerializer

    def partial_update(self, request, pk=None):
        """PATCH /api/order-items/{id}/ - обновить количество товара"""
        try:
            item = OrderItem.objects.get(pk=pk)
            if item.order.user != request.user:
                return Response({'detail': 'Доступ запрещен'}, status=403)
            
            new_quantity = request.data.get('quantity')
            if not new_quantity:
                return Response({'detail': 'Количество требуется'}, status=400)
            
            try:
                new_quantity = int(new_quantity)
            except (ValueError, TypeError):
                return Response({'detail': 'Количество должно быть числом'}, status=400)
            
            if new_quantity < 1:
                return Response({'detail': 'Количество должно быть больше 0'}, status=400)
            
            if item.product.stock < new_quantity:
                return Response({'detail': f'Недостаточно товара. Доступно: {item.product.stock}'}, status=400)
            
            item.quantity = new_quantity
            item.total_price = item.price * item.quantity
            item.save()
            
            item.order.recalc_total()
            
            serializer = OrderItemSerializer(item, context={'request': request})
            return Response(serializer.data)
        except OrderItem.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'detail': f'Ошибка: {str(e)}'}, status=500)

    def destroy(self, request, pk=None):
        """DELETE /api/order-items/{id}/ - удалить товар из заказа"""
        try:
            item = OrderItem.objects.get(pk=pk)
            if item.order.user != request.user:
                return Response({'detail': 'Доступ запрещен'}, status=403)
            
            order = item.order
            item.delete()
            order.recalc_total()
            
            return Response({'detail': 'Товар удален'}, status=204)
        except OrderItem.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'detail': f'Ошибка: {str(e)}'}, status=500)
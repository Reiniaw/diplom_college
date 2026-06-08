from django.contrib.auth import get_user_model
from rest_framework import viewsets, generics, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.db.models import F
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings as django_settings
import secrets
from django.urls import reverse

from .models import Category, Product, Order, OrderItem, TechField, ProductImage, ProductTechValue, Favorite, Review
from .serializers import (
    CategorySerializer, ProductSerializer,
    OrderSerializer, AddItemSerializer,
    UserSerializer, RegisterSerializer, TechFieldSerializer,
    OrderItemSerializer, OrderItemUpdateSerializer, UserUpdateSerializer, FavoriteSerializer, ReviewSerializer
)

User = get_user_model()


# ─── ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: отправка чека на email ──────────────────────────
def send_order_receipt(order, recipient_email):
    """Отправляет HTML-чек на указанный email после оформления заказа."""
    if not recipient_email:
        print(f"[EMAIL] ⚠️ Нет email адреса для отправки чека заказа #{order.id}")
        return

    print(f"[EMAIL] Начинаем отправку чека для заказа #{order.id} на {recipient_email}")

    items_html = ""
    for item in order.items.all():
        items_html += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#e2e8f0">{item.product.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:center">{item.quantity} шт.</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#38bdf8;text-align:right;font-family:monospace">{item.total_price} ₸</td>
        </tr>"""

    html_message = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px">

        <div style="text-align:center;margin-bottom:40px">
          <h1 style="color:#38bdf8;font-size:28px;font-style:italic;font-weight:900;text-transform:uppercase;margin:0">
            PRO LENS
          </h1>
          <p style="color:#475569;font-size:13px;margin:8px 0 0;text-transform:uppercase;letter-spacing:0.15em">
            Ваш заказ подтверждён
          </p>
        </div>

        <div style="background:#1e293b;border-radius:20px;padding:32px;margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <div>
              <p style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">Номер заказа</p>
              <p style="color:#38bdf8;font-size:24px;font-weight:900;font-style:italic;margin:0">#{order.id}</p>
            </div>
            <div style="text-align:right">
              <p style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">Дата</p>
              <p style="color:#e2e8f0;font-size:14px;margin:0">{order.created_at.strftime('%d.%m.%Y %H:%M')}</p>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;text-align:left;padding-bottom:12px;border-bottom:1px solid #334155">Товар</th>
                <th style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;text-align:center;padding-bottom:12px;border-bottom:1px solid #334155">Кол-во</th>
                <th style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;text-align:right;padding-bottom:12px;border-bottom:1px solid #334155">Сумма</th>
              </tr>
            </thead>
            <tbody>{items_html}</tbody>
          </table>

          <div style="margin-top:24px;padding-top:16px;border-top:2px solid #334155;display:flex;justify-content:space-between;align-items:center">
            <span style="color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">Итого</span>
            <span style="color:#38bdf8;font-size:28px;font-weight:900;font-family:monospace">{order.total_price} ₸</span>
          </div>
        </div>

        <div style="background:#1e293b;border-radius:20px;padding:24px;margin-bottom:24px">
          <p style="color:#38bdf8;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 16px;font-weight:700">Доставка</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px">
            <span style="color:#475569;font-size:11px;text-transform:uppercase;margin-right:8px">Адрес:</span>
            {order.address or 'Не указан'}
          </p>
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px">
            <span style="color:#475569;font-size:11px;text-transform:uppercase;margin-right:8px">Телефон:</span>
            {order.phone or 'Не указан'}
          </p>
          <p style="color:#e2e8f0;font-size:14px;margin:0">
            <span style="color:#475569;font-size:11px;text-transform:uppercase;margin-right:8px">Время:</span>
            {order.delivery_time or 'Не указано'}
          </p>
          {'<p style="color:#94a3b8;font-size:13px;margin:12px 0 0;padding:12px;background:#0f172a;border-radius:10px;border-left:3px solid #38bdf8">'+order.notes+'</p>' if order.notes else ''}
        </div>

        <div style="text-align:center;color:#334155;font-size:12px;line-height:1.7">
          <p style="margin:0">Спасибо за покупку в <strong style="color:#475569">Pro Lens</strong></p>
          <p style="margin:4px 0 0">Это письмо сформировано автоматически, отвечать на него не нужно</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        result = send_mail(
            subject=f'Pro Lens — Заказ #{order.id} подтверждён',
            message=f'Ваш заказ #{order.id} на сумму {order.total_price} ₸ принят.',
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[EMAIL] ✅ Чек отправлен на {recipient_email} (результат: {result})")
    except Exception as e:
        print(f"[EMAIL] ❌ ОШИБКА отправки чека: {e}")
        print(f"[EMAIL] Переменные: FROM={django_settings.DEFAULT_FROM_EMAIL}, TO={recipient_email}")


def send_status_notification(order):
    """Отправляет уведомление об изменении статуса заказа."""
    email = order.user.email
    if not email:
        return

    status_labels = {
        'placed':    ('Принят в обработку', '#38bdf8'),
        'shipped':   ('Передан в доставку', '#4ade80'),
        'delivered': ('Доставлен', '#10b981'),
        'cancelled': ('Отменён', '#f87171'),
    }
    label, color = status_labels.get(order.status, ('Обновлён', '#94a3b8'))

    html_message = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif">
      <div style="max-width:500px;margin:0 auto;padding:40px 20px;text-align:center">
        <h1 style="color:#38bdf8;font-size:24px;font-style:italic;font-weight:900;text-transform:uppercase">PRO LENS</h1>

        <div style="background:#1e293b;border-radius:20px;padding:32px;margin-top:24px">
          <p style="color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px">Заказ #{order.id}</p>
          <p style="color:{color};font-size:22px;font-weight:900;margin:0 0 24px">{label}</p>

          <div style="background:#0f172a;border-radius:12px;padding:16px;text-align:left">
            <p style="color:#475569;font-size:11px;text-transform:uppercase;margin:0 0 8px">Состав</p>
            {''.join([f'<p style="color:#e2e8f0;font-size:14px;margin:4px 0">{item.product.name} × {item.quantity}</p>' for item in order.items.all()])}
            <p style="color:#38bdf8;font-size:18px;font-weight:700;font-family:monospace;margin:12px 0 0;text-align:right">{order.total_price} ₸</p>
          </div>
        </div>

        <p style="color:#334155;font-size:12px;margin-top:24px">Pro Lens — фото и видео техника</p>
      </div>
    </body>
    </html>
    """

    try:
        result = send_mail(
            subject=f'Pro Lens — Статус заказа #{order.id}: {label}',
            message=f'Статус вашего заказа #{order.id} изменён: {label}',
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[EMAIL] ✓ Уведомление отправлено на {email} (статус: {order.status})")
    except Exception as e:
        print(f"[EMAIL] ✗ Ошибка отправки уведомления: {e}")
        print(f"[EMAIL] Переменные: FROM={django_settings.DEFAULT_FROM_EMAIL}, TO={email}")


# ─── ПРАВА ДОСТУПА ─────────────────────────────────────────────────────────────
class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'

class IsStaffOrDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['seller', 'manager', 'director']


# ─── СТАТИСТИКА ────────────────────────────────────────────────────────────────
class DirectorStatsView(APIView):
    permission_classes = [IsDirector]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        placed_orders = Order.objects.filter(status=Order.STATUS_PLACED)
        order_items = OrderItem.objects.filter(order__status=Order.STATUS_PLACED)

        if date_from:
            placed_orders = placed_orders.filter(created_at__date__gte=date_from)
            order_items = order_items.filter(order__created_at__date__gte=date_from)
        if date_to:
            placed_orders = placed_orders.filter(created_at__date__lte=date_to)
            order_items = order_items.filter(order__created_at__date__lte=date_to)

        total_sales = placed_orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
        orders_count = placed_orders.count()
        top_products = order_items.values(product__name=F('product__name')) \
            .annotate(total_qty=Sum('quantity')) \
            .order_by('-total_qty')[:5]

        daily_stats = placed_orders.annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(total=Sum('total_price'), count=Count('id')) \
            .order_by('-date')

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


# ─── ТЕХНИЧЕСКИЕ ПОЛЯ ──────────────────────────────────────────────────────────
class TechFieldViewSet(viewsets.ModelViewSet):
    queryset = TechField.objects.all()
    serializer_class = TechFieldSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffOrDirector()]
        return [AllowAny()]


# ─── КАТЕГОРИИ ─────────────────────────────────────────────────────────────────
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffOrDirector()]
        return [AllowAny()]


# ─── ТОВАРЫ ────────────────────────────────────────────────────────────────────
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'delete_image']:
            return [IsStaffOrDirector()]
        return [AllowAny()]

    def _extract_tech_values(self, data, category_id):
        """Извлекает tech_values из данных запроса, возвращает чистые строки."""
        tech_values_data = {}
        if not category_id:
            return tech_values_data
        try:
            category = Category.objects.get(id=category_id)
            for tech_field in category.tech_fields.all():
                if tech_field.key in data:
                    raw = data.pop(tech_field.key)
                    # FIX: всегда берём первый элемент если это список (QueryDict)
                    tech_values_data[tech_field.id] = raw[0] if isinstance(raw, list) else raw
        except Category.DoesNotExist:
            pass
        return tech_values_data

    def create(self, request, *args, **kwargs):
        images = request.FILES.getlist('images', [])
        data = request.data.copy()
        data.pop('images', None)

        tech_values_data = self._extract_tech_values(data, data.get('category'))

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        for tech_field_id, value in tech_values_data.items():
            if value:
                ProductTechValue.objects.create(
                    product=product, tech_field_id=tech_field_id, value=value
                )

        for image_file in images:
            ProductImage.objects.create(product=product, image=image_file)

        return Response(ProductSerializer(product).data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        images = request.FILES.getlist('images', [])
        data = request.data.copy()
        data.pop('images', None)

        category_id = data.get('category', instance.category_id)
        tech_values_data = self._extract_tech_values(data, category_id)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        for tech_field_id, value in tech_values_data.items():
            tech_value, created = ProductTechValue.objects.get_or_create(
                product=product, tech_field_id=tech_field_id, defaults={'value': value}
            )
            if not created:
                tech_value.value = value
                tech_value.save()

        for image_file in images:
            ProductImage.objects.create(product=product, image=image_file)

        return Response(ProductSerializer(product).data)

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """DELETE /api/products/{product_id}/images/{image_id}/"""
        try:
            product = self.get_object()
            image = ProductImage.objects.get(id=image_id, product=product)
            image.image.delete(save=False)
            image.delete()
            return Response({'detail': 'Фото удалено'}, status=204)
        except ProductImage.DoesNotExist:
            return Response({'detail': 'Фото не найдено'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


# ─── ПРОФИЛЬ ───────────────────────────────────────────────────────────────────
class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=400)

class DirectorUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsDirector]


# ─── ЗАКАЗЫ ────────────────────────────────────────────────────────────────────
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

        # Отправляем уведомление об изменении статуса
        send_status_notification(order)

        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='current-cart')
    def current_cart(self, request):
        order, _ = Order.objects.get_or_create(
            user=request.user, status=Order.STATUS_CART, defaults={'total_price': 0}
        )
        return Response(OrderSerializer(order, context={'request': request}).data)

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

        # Отправляем чек на email
        # Берём email из тела запроса (пользователь может указать другой),
        # или fallback на email из профиля
        receipt_email = request.data.get('receipt_email') or request.user.email
        print(f"[CHECKOUT] Оформление заказа #{order.id}")
        print(f"[CHECKOUT]   receipt_email из request: {request.data.get('receipt_email')}")
        print(f"[CHECKOUT]   user.email: {request.user.email}")
        print(f"[CHECKOUT]   Итоговый email: {receipt_email}")
        
        if receipt_email:
            send_order_receipt(order, receipt_email)
        else:
            print(f"[CHECKOUT] ⚠️ Email не найден, письмо не отправляется")

        return Response(OrderSerializer(order).data)


# ─── ПОЗИЦИИ ЗАКАЗА ────────────────────────────────────────────────────────────
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = OrderItemSerializer

    def partial_update(self, request, pk=None):
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

            return Response(OrderItemSerializer(item, context={'request': request}).data)
        except OrderItem.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'detail': f'Ошибка: {str(e)}'}, status=500)

    def destroy(self, request, pk=None):
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


# ─── ИЗБРАННОЕ ─────────────────────────────────────────────────────────────────
class FavoriteViewSet(viewsets.ViewSet):
    """
    GET  /favorites/            — список избранного текущего пользователя
    POST /favorites/            — добавить товар { "product_id": <id> }
    DELETE /favorites/<id>/     — убрать из избранного (id — это id Favorite, не Product)
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('product')
        serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        serializer = FavoriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # unique_together сам отловит дубль, но дадим понятную ошибку
            if Favorite.objects.filter(user=request.user, product=serializer.validated_data['product']).exists():
                return Response({'detail': 'Уже в избранном'}, status=400)
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def destroy(self, request, pk=None):
        try:
            fav = Favorite.objects.get(pk=pk, user=request.user)
            fav.delete()
            return Response(status=204)
        except Favorite.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=404)


# ─── ОТЗЫВЫ ────────────────────────────────────────────────────────────────────
class ReviewViewSet(viewsets.ViewSet):
    """
    GET  /products/<product_id>/reviews/       — список отзывов к товару
    POST /products/<product_id>/reviews/       — оставить отзыв
    DELETE /products/<product_id>/reviews/<id>/ — удалить свой отзыв
    """

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def list(self, request, product_pk=None):
        reviews = Review.objects.filter(product_id=product_pk).select_related('user')
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, product_pk=None):
        # Один отзыв на товар
        if Review.objects.filter(user=request.user, product_id=product_pk).exists():
            return Response({'detail': 'Вы уже оставляли отзыв на этот товар'}, status=400)

        try:
            product = Product.objects.get(pk=product_pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=404)

        serializer = ReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user, product=product)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def destroy(self, request, product_pk=None, pk=None):
        try:
            review = Review.objects.get(pk=pk, product_id=product_pk, user=request.user)
            review.delete()
            return Response(status=204)
        except Review.DoesNotExist:
            return Response({'detail': 'Отзыв не найден или вы не автор'}, status=404)


class SendEmailVerificationView(APIView):
    """POST /api/send-verification/ — отправить письмо с подтверждением"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'detail': 'Email уже подтверждён'}, status=400)
        if not user.email:
            return Response({'detail': 'Сначала укажите email в профиле'}, status=400)

        # Генерируем токен
        token = secrets.token_urlsafe(32)
        user.email_verify_token = token
        user.save(update_fields=['email_verify_token'])

        # Ссылка подтверждения — фронтенд перехватит её
        verify_url = f"{django_settings.FRONTEND_URL}/verify-email?token={token}"

        html_message = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif">
          <div style="max-width:500px;margin:0 auto;padding:40px 20px;text-align:center">
            <h1 style="color:#38bdf8;font-size:24px;font-style:italic;font-weight:900;text-transform:uppercase">PRO LENS</h1>
            <div style="background:#1e293b;border-radius:20px;padding:32px;margin-top:24px">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 24px">Привет, <b>{user.username}</b>!</p>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 32px">Нажми кнопку ниже, чтобы подтвердить свой email-адрес.</p>
              <a href="{verify_url}" style="display:inline-block;background:#38bdf8;color:#0f172a;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;padding:16px 40px;border-radius:12px;text-decoration:none">
                Подтвердить Email
              </a>
              <p style="color:#475569;font-size:12px;margin:24px 0 0">Ссылка действительна 24 часа.<br>Если вы не запрашивали — проигнорируйте это письмо.</p>
            </div>
          </div>
        </body>
        </html>
        """

        try:
            send_mail(
                subject='Pro Lens — Подтверждение email',
                message=f'Подтвердите email: {verify_url}',
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"[EMAIL] ❌ Ошибка отправки верификации: {e}")
            return Response({'detail': 'Ошибка отправки письма'}, status=500)

        return Response({'detail': 'Письмо отправлено'})


class VerifyEmailView(APIView):
    """GET /api/verify-email/?token=... — подтвердить email по токену"""
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Токен не указан'}, status=400)
        try:
            user = User.objects.get(email_verify_token=token)
            user.email_verified = True
            user.email_verify_token = None
            user.save(update_fields=['email_verified', 'email_verify_token'])
            return Response({'detail': 'Email успешно подтверждён!'})
        except User.DoesNotExist:
            return Response({'detail': 'Email уже подтверждён!'})
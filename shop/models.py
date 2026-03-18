from django.db import models
from decimal import Decimal
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название категории")

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', verbose_name="Категория")
    name = models.CharField(max_length=150, verbose_name="Название товара")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    image = models.ImageField(upload_to='products/', null=True, blank=True)

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CART = 'cart'
    STATUS_PLACED = 'placed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_CART, 'Cart'),
        (STATUS_PLACED, 'Placed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Адрес доставки")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Номер телефона")
    delivery_time = models.CharField(max_length=100, blank=True, null=True, verbose_name="Время доставки")
    notes = models.TextField(blank=True, null=True, verbose_name="Комментарий")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CART)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} ({self.user.username}) - {self.status}'

    def recalc_total(self):
        total = Decimal('0')
        for item in self.items.all():
            total += item.total_price
        self.total_price = total
        self.save(update_fields=['total_price'])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('shop.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)  # price at moment of adding
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('order', 'product')

    def save(self, *args, **kwargs):
        # ensure price and total
        if not self.price:
            self.price = self.product.price
        self.total_price = Decimal(self.price) * self.quantity
        super().save(*args, **kwargs)
        # update order total
        self.order.recalc_total()

class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'Обычный пользователь'),
        ('seller', 'Продавец'),
        ('manager', 'Руководитель'),
        ('director', 'Директор'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    # Это поможет нам в будущем не создавать ошибки с миграциями
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
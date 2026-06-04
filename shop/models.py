from django.db import models
from decimal import Decimal
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class TechField(models.Model):
    key = models.CharField(max_length=50, unique=True, verbose_name="Ключ")
    label = models.CharField(max_length=100, verbose_name="Название поля")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Техническое поле"
        verbose_name_plural = "Технические поля"

    def __str__(self):
        return self.label


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название категории")
    tech_fields = models.ManyToManyField(TechField, blank=True, verbose_name="Технические характеристики")

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
    stock = models.PositiveIntegerField(default=0, verbose_name="Количество в наличии")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    megapixels = models.CharField(max_length=50, blank=True, null=True, verbose_name="Мегапиксели")
    sensor_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="Тип матрицы")
    video_resolution = models.CharField(max_length=100, blank=True, null=True, verbose_name="Разрешение видео")
    weight = models.CharField(max_length=50, blank=True, null=True, verbose_name="Вес")
    power = models.CharField(max_length=50, blank=True, null=True, verbose_name="Мощность (Вт)")
    frequency = models.CharField(max_length=100, blank=True, null=True, verbose_name="Частотный диапазон")
    battery_life = models.CharField(max_length=50, blank=True, null=True, verbose_name="Время работы (ч)")
    connection = models.CharField(max_length=100, blank=True, null=True, verbose_name="Подключение")

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self):
        return self.name
    
    def is_in_stock(self):
        """Проверяет, есть ли товар в наличии"""
        return self.stock > 0
    
    @property
    def image(self):
        """Для совместимости - возвращает первое изображение"""
        first_image = self.images.first()
        return first_image.image if first_image else None


class ProductTechValue(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='tech_values', verbose_name="Товар")
    tech_field = models.ForeignKey(TechField, on_delete=models.CASCADE, verbose_name="Техническое поле")
    value = models.CharField(max_length=255, blank=True, verbose_name="Значение")

    class Meta:
        verbose_name = "Значение тех. поля товара"
        verbose_name_plural = "Значения тех. полей товаров"
        unique_together = ('product', 'tech_field')

    def __str__(self):
        return f"{self.product.name} - {self.tech_field.label}: {self.value}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name="Товар")
    image = models.ImageField(upload_to='products/', verbose_name="Изображение")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Изображение товара"
        verbose_name_plural = "Изображения товаров"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.product.name} - фото"


class Order(models.Model):
    STATUS_CART = 'cart'
    STATUS_PLACED = 'placed'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_CART, 'Cart'),
        (STATUS_PLACED, 'Placed'),
        (STATUS_SHIPPED, 'Shipped'),
        (STATUS_DELIVERED, 'Delivered'),
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
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Номер телефона")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Адрес доставки")

    # Это поможет нам в будущем не создавать ошибки с миграциями
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')  # нельзя добавить один товар дважды
        ordering = ['-created_at']
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'

    def __str__(self):
        return f'{self.user.username} → {self.product.name}'


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],  # 1–5 звёзд
        verbose_name='Оценка'
    )
    text = models.TextField(blank=True, verbose_name='Текст отзыва')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')  # один отзыв на товар
        ordering = ['-created_at']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'

    def __str__(self):
        return f'{self.user.username} — {self.product.name} ({self.rating}★)'
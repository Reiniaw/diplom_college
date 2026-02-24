from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import Category, Product, Order, OrderItem

# Получаем твою кастомную модель пользователя
User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Настраиваем отображение полей в самой форме редактирования
    # Мы добавляем 'role' в раздел "Personal info" или создаем новый
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('role',)}),
    )
    
    # Чтобы при создании пользователя через админку тоже можно было выбрать роль
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {'fields': ('role',)}),
    )

    # Что мы видим в общем списке пользователей
    list_display = ('id', 'username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')

# Твои остальные регистрации остаются без изменений:
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'created_at')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price', 'total_price')
    search_fields = ('product__name', 'order__id')
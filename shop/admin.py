from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import Category, Product, Order, OrderItem, ProductImage, ProductTechValue, TechField

User = get_user_model()

# Инлайн для картинок товара
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3  # 3 пустых слота для загрузки картинок
    fields = ('image',)

# Инлайн для тех. характеристик
class ProductTechValueInline(admin.TabularInline):
    model = ProductTechValue
    extra = 1
    fields = ('tech_field', 'value')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {'fields': ('role',)}),
    )
    list_display = ('id', 'username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'stock', 'created_at')
    list_editable = ('price', 'stock')  # редактировать прямо в списке
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline, ProductTechValueInline]  # картинки и хар-ки внутри товара

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price', 'total_price')
    search_fields = ('product__name', 'order__id')

@admin.register(TechField)
class TechFieldAdmin(admin.ModelAdmin):
    list_display = ('id', 'key', 'label')
    search_fields = ('key', 'label')
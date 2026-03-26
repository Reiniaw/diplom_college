from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, TechField, ProductImage
from django.contrib.auth import get_user_model

User = get_user_model()

class TechFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechField
        fields = ['id', 'key', 'label']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class CategorySerializer(serializers.ModelSerializer):
    tech_fields = TechFieldSerializer(many=True, read_only=True)
    tech_field_ids = serializers.PrimaryKeyRelatedField(
        queryset=TechField.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='tech_fields'
    )
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'tech_fields', 'tech_field_ids']

class ProductSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()
    product_images = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'product_images', 'quantity', 'price', 'total_price']

    def get_product_image(self, obj):
        """Первое изображение товара для совместимости"""
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def get_product_images(self, obj):
        """Все изображения товара"""
        images = obj.product.images.all()
        request = self.context.get('request')
        if request:
            return [request.build_absolute_uri(img.image.url) for img in images]
        return [img.image.url for img in images]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.ReadOnlyField(source='user.username') # Чтобы видеть, кто купил

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'status', 'created_at', 'total_price', 'items', 'address', 'phone', 'delivery_time', 'notes']

class AddItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role']
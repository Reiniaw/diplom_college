from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, TechField, ProductImage, ProductTechValue, Favorite, Review
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()

class TechFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechField
        fields = ['id', 'key', 'label']

class ProductTechValueSerializer(serializers.ModelSerializer):
    tech_field = TechFieldSerializer(read_only=True)
    tech_field_id = serializers.PrimaryKeyRelatedField(
        queryset=TechField.objects.all(),
        write_only=True,
        source='tech_field'
    )
    
    class Meta:
        model = ProductTechValue
        fields = ['id', 'tech_field', 'tech_field_id', 'value']

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
    tech_values = ProductTechValueSerializer(many=True, read_only=True)
    is_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
    
    def get_is_in_stock(self, obj):
        """Возвращает True если товар в наличии"""
        return obj.is_in_stock()

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

class OrderItemUpdateSerializer(serializers.ModelSerializer):
    """Простой сериализатор для обновления количества товара"""
    class Meta:
        model = OrderItem
        fields = ['quantity']

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
    username = serializers.CharField(
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            lookup='iexact',
            message="Аккаунт с таким логином уже существует"
        )]
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            lookup='iexact',
            message="Аккаунт с таким email уже зарегистрирован"
        )]
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'address', 'first_name', 'last_name']

class UserUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    username = serializers.CharField(
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            lookup='iexact',
            message="Этот логин уже занят"
        )]
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            lookup='iexact',
            message="Этот email уже используется другим аккаунтом"
        )]
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',  # добавили username
                  'phone', 'address', 'current_password', 'new_password']

    def validate_new_password(self, value):
        if value:
            validate_password(value)
        return value

    def validate(self, data):
        new_password = data.get('new_password')
        current_password = data.get('current_password')
        if new_password:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Введите текущий пароль'})
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Неверный текущий пароль'})
        return data

    def update(self, instance, validated_data):
        validated_data.pop('current_password', None)
        new_password = validated_data.pop('new_password', None)

        # Если email изменился — сбросить верификацию
        new_email = validated_data.get('email')
        if new_email and new_email != instance.email:
            instance.email_verified = False
            instance.email_verify_token = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance

class FavoriteSerializer(serializers.ModelSerializer):
    # Полные данные о товаре, чтобы сразу рендерить карточку
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'product_id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    # is_mine нужен фронту: чтобы показать кнопку "Удалить" только автору
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'text', 'created_at', 'is_mine']
        read_only_fields = ['id', 'username', 'created_at', 'is_mine']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'address', 'email_verified']  # добавили email_verified
 
 
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
 
 
class PasswordResetConfirmSerializer(serializers.Serializer):
    token        = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True)
 
    def validate_new_password(self, value):
        validate_password(value)
        return value
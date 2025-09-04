from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'is_active', 'created_at', 'products_count']
        
    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()
    
    
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    profit_margin = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'image_url', 'category', 'category_name',
            'description', 'kilograms', 'sale_price', 'cost_price', 
            'in_stock', 'minimum_stock', 'is_active', 'profit_margin',
            'is_low_stock', 'created_at', 'updated_at'
        ]
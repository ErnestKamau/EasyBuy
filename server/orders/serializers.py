from rest_framework import serializers
from .models import OrderItems, Order

class OrderSerializer(serializers.ModelSerializer):
    total_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'customer_name', 'customer_phone',
            'notes', 'status', 'order_date', 'order_time', 'updated_at', 'total_amount'
        ]
        
class OrderItemsSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItems
        fields = [
            'id', 'order', 'product', 'product_name',
            'quantity', 'kilogram', 'unit_price', 'notes', 'subtotal'
        ]


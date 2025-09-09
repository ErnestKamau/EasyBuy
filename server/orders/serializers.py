from rest_framework import serializers
from .models import OrderItems, Order

class OrderSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    total_amount = serializers.ReadOnlyField()
    
    class Meta:
        models = Order
        fields = [
            'id', 'user', 'user_name', ' customer_name', 'customer_phone',
            'notes', 'status', 'order_date', 'order_time', 'updated_at'
        ]
        

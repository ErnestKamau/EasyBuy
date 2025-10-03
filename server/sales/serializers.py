from rest_framework import serializers
from .models import Sale, SaleItem, Payment
from orders.models import Order

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.URLField(source='product.image_url', read_only=True)
    category_name = serializers.CharField(source='product.category_name', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_image', 'category_name',
            'quantity', 'unit_price', 'sale_price', 'subtotal', 'profit_total'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'method', 'amount', 'reference', 'notes', 'paid_at'
        ]

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_fully_paid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'order_id', 'sale_number', 'customer_name', 'customer_phone',
            'total_amount', 'cost_amount', 'profit_amount', 'payment_status',
            'due_date', 'made_on', 'updated_on', 'total_paid', 'balance', 
            'is_fully_paid', 'items', 'payments'
        ]

class CreatePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['method', 'amount', 'reference', 'notes']

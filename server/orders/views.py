from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem
from sales.models import Sale, SaleItem
from products.models import Product

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None): # Convert order to sale and update stock
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'error': 'Only pending orders can be confirmed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Check stock availability
                for item in order.items.all():
                    if item.product.in_stock < item.quantity:
                        return Response(
                            {'error': f'Insufficient stock for {item.product.name}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Create sale
                total_cost = sum(
                    item.quantity * item.product.cost_price 
                    for item in order.items.all()
                )
                total_revenue = order.total_amount
                
                sale = Sale.objects.create(
                    order=order,
                    customer_name=order.customer_name,
                    customer_phone=order.customer_phone,
                    total_amount=total_revenue,
                    cost_amount=total_cost,
                    profit_amount=total_revenue - total_cost,
                )
                
                # Create sale items and update stock
                for item in order.items.all():
                    SaleItem.objects.create(
                        sale=sale,
                        product=item.product,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        cost_price=item.product.cost_price
                    )
                    
                    # Update product stock
                    item.product.in_stock -= item.quantity
                    item.product.save()
                
                # Update order status
                order.status = 'confirmed'
                order.save()
                
                return Response({
                    'message': 'Order confirmed successfully',
                    'sale_id': sale.id
                })
                
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


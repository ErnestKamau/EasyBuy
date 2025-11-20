from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Order, OrderItems
from sales.models import Sale, SaleItem
from products.models import Product
from django.utils import timezone
from .serializers import OrderSerializer, OrderItemsSerializer
from products.permissions import IsAdmin

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-order_date', '-order_time')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admins can see all orders, customers only their own
        if user.role == 'admin':
            return queryset
        else:
            return queryset.filter(user=user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None): # Convert order to sale and update stock
        order = self.get_object()

        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be confirmed'}, status=status.HTTP_400_BAD_REQUEST)

        # admin can optionally pass payment info in body: { payment_method: 'mpesa'|'cash'|'debt', mark_as_debt_days: 7 }
        payment_method = request.data.get('payment_method')
        mark_as_debt_days = request.data.get('mark_as_debt_days', None)

        try:
            with transaction.atomic():
                # Check stock availability
                for item in order.items.all():
                    # For weight-based products, check if we have enough stock
                    if item.product.kilograms:
                        # For weight-based, we check if in_stock (which represents available weight) is sufficient
                        required_weight = float(item.kilogram) if item.kilogram else 0
                        if item.product.in_stock < required_weight:
                            return Response({'error': f'Insufficient stock for {item.product.name}. Available: {item.product.in_stock}kg, Required: {required_weight}kg'}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # For quantity-based products
                        if item.product.in_stock < item.quantity:
                            return Response({'error': f'Insufficient stock for {item.product.name}. Available: {item.product.in_stock}, Required: {item.quantity}'}, status=status.HTTP_400_BAD_REQUEST)

                # Calculate totals
                total_revenue = sum(item.subtotal for item in order.items.all())
                # Calculate cost - for weight-based products, use kilogram, otherwise use quantity
                total_cost = sum(
                    (float(item.kilogram) * (item.product.cost_price or 0) if item.kilogram and item.product.kilograms 
                     else item.quantity * (item.product.cost_price or 0))
                    for item in order.items.all()
                )

                # Create a Sale record
                sale = Sale.objects.create(
                    order=order,
                    sale_number=f"SALE-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    customer_name=order.customer_name,
                    customer_phone=order.customer_phone,
                    total_amount=total_revenue,
                    cost_amount=total_cost,
                    profit_amount=total_revenue - total_cost,
                )

                # Create sale items and decrement stock
                for item in order.items.all():
                    # Determine quantity for sale item (for weight-based, use 1, for quantity-based use actual quantity)
                    sale_quantity = 1 if item.product.kilograms and item.kilogram else item.quantity
                    
                    SaleItem.objects.create(
                        sale=sale,
                        product=item.product,
                        quantity=sale_quantity,
                        unit_price=item.unit_price,
                        cost_price=(item.product.cost_price or 0),
                    )

                    # decrement inventory
                    prod = item.product
                    if prod.kilograms and item.kilogram:
                        # For weight-based products, subtract the weight
                        prod.in_stock = max(0, prod.in_stock - float(item.kilogram))
                    else:
                        # For quantity-based products, subtract the quantity
                        prod.in_stock = max(0, prod.in_stock - item.quantity)
                    prod.save()

                order.status = 'confirmed'

                # Handle payment_status and sale.payment_status
                if payment_method in ('cash', 'mpesa'):
                    order.payment_status = 'PAID'
                    sale.payment_status = 'fully-paid'
                    sale.save()
                elif payment_method == 'debt' or mark_as_debt_days:
                    order.payment_status = 'DEBT'
                    sale.set_as_debt(days=int(mark_as_debt_days) if mark_as_debt_days else 7)
                    sale.update_payment_status()
                else:
                    order.payment_status = 'PENDING'

                order.save()

                return Response({'message': 'Order confirmed successfully', 'sale_id': sale.id})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create Order API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create a new order from cart items"""
    try:
        data = request.data
        cart_items = data.get('items', [])
        
        if not cart_items:
            return Response(
                {'error': 'No items provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                user=request.user,
                customer_name=request.user.username,
                customer_phone=getattr(request.user, 'phone_number', ''),
                notes=data.get('notes', ''),
                status='pending',
                delivery_type=data.get('delivery_type', 'pickup'),
                payment_method=data.get('payment_method', 'cash')
            )
            
            # Create order items
            order_items = []
            for cart_item in cart_items:
                product_id = cart_item.get('product_id')
                quantity = cart_item.get('quantity', 1)
                weight = cart_item.get('weight', None)
                
                # Get product
                product = get_object_or_404(Product, id=product_id)
                
                # Calculate unit price based on weight or quantity
                if product.kilograms and weight:
                    unit_price = product.sale_price / product.kilograms
                else:
                    unit_price = product.sale_price
                
                # Create order item
                order_item = OrderItems.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    kilogram=weight if weight else None,
                    unit_price=unit_price
                )
                order_items.append(order_item)
            
            serializer = OrderSerializer(order)
            return Response({
                'message': 'Order created successfully',
                'order': serializer.data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Get Order Details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_details(request, order_id):
    """Get detailed order information including items"""
    try:
        order = get_object_or_404(Order, id=order_id)
        
        # Check permissions
        if request.user.role != 'admin' and order.user != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        order_data = OrderSerializer(order).data
        items_data = OrderItemsSerializer(order.items.all(), many=True).data
        
        return Response({
            'order': order_data,
            'items': items_data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Admin endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_pending_orders(request):
    """Get all pending orders for admin"""
    try:
        pending_orders = Order.objects.filter(status='pending').order_by('-order_date', '-order_time')
        serializer = OrderSerializer(pending_orders, many=True)
        return Response({
            'orders': serializer.data,
            'count': pending_orders.count()
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


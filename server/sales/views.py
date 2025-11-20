from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from products.permissions import IsAdmin
from .models import Sale, SaleItem, Payment
from .serializers import SaleSerializer, PaymentSerializer, CreatePaymentSerializer

class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading sales data - admin only"""
    queryset = Sale.objects.all().order_by('-made_on')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a sale"""
        sale = self.get_object()
        serializer = CreatePaymentSerializer(data=request.data)
        
        if serializer.is_valid():
            payment = serializer.save(sale=sale)
            sale.update_payment_status()
            
            return Response({
                'message': 'Payment added successfully',
                'payment': PaymentSerializer(payment).data,
                'sale': SaleSerializer(sale).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_sales_analytics(request):
    """Get sales analytics and statistics"""
    try:
        # Date range filter
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        sales = Sale.objects.filter(made_on__gte=start_date)
        
        # Basic metrics
        total_sales = sales.count()
        total_revenue = sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_cost = sales.aggregate(Sum('cost_amount'))['cost_amount__sum'] or 0
        total_profit = sales.aggregate(Sum('profit_amount'))['profit_amount__sum'] or 0
        
        # Payment status breakdown
        payment_status_counts = {}
        for status_code, status_name in Sale.PAYMENT_STATUS_CHOICES:
            count = sales.filter(payment_status=status_code).count()
            payment_status_counts[status_code] = {
                'name': status_name,
                'count': count
            }
        
        # Recent sales
        recent_sales = sales[:10]
        recent_sales_data = SaleSerializer(recent_sales, many=True).data
        
        # Daily sales for chart (last 7 days)
        daily_sales = []
        for i in range(7):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_sales = sales.filter(
                made_on__gte=day_start,
                made_on__lt=day_end
            )
            
            daily_sales.append({
                'date': day.strftime('%Y-%m-%d'),
                'sales_count': day_sales.count(),
                'revenue': float(day_sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
            })
        
        daily_sales.reverse()  # Show oldest first
        
        return Response({
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'total_cost': float(total_cost),
            'total_profit': float(total_profit),
            'profit_margin': float((total_profit / total_revenue * 100) if total_revenue > 0 else 0),
            'payment_status_breakdown': payment_status_counts,
            'recent_sales': recent_sales_data,
            'daily_sales': daily_sales,
            'period_days': days
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_overdue_payments(request):
    """Get sales with overdue payments"""
    try:
        overdue_sales = Sale.objects.filter(
            payment_status__in=['partial', 'no-payment'],
            due_date__lt=timezone.now()
        ).order_by('due_date')
        
        return Response({
            'overdue_sales': SaleSerializer(overdue_sales, many=True).data,
            'count': overdue_sales.count()
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_payment_summary(request):
    """Get payment summary for today"""
    try:
        today = timezone.now().date()
        today_payments = Payment.objects.filter(paid_at__date=today)
        
        cash_total = today_payments.filter(method='cash').aggregate(Sum('amount'))['amount__sum'] or 0
        mpesa_total = today_payments.filter(method='mpesa').aggregate(Sum('amount'))['amount__sum'] or 0
        other_total = today_payments.exclude(method__in=['cash', 'mpesa']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            'date': today.isoformat(),
            'total_payments': float(cash_total + mpesa_total + other_total),
            'cash_total': float(cash_total),
            'mpesa_total': float(mpesa_total),
            'other_total': float(other_total),
            'transaction_count': today_payments.count(),
            'recent_payments': PaymentSerializer(
                today_payments.order_by('-paid_at')[:10], many=True
            ).data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_unpaid_sales(request):
    """Get sales that haven't been fully paid"""
    try:
        unpaid_sales = Sale.objects.exclude(
            payment_status='fully-paid'
        ).order_by('made_on')
        
        return Response({
            'unpaid_sales': SaleSerializer(unpaid_sales, many=True).data,
            'count': unpaid_sales.count()
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_debts(request):
    """Get all debts (sales with due_date)"""
    try:
        debts = Sale.objects.filter(
            due_date__isnull=False
        ).exclude(
            payment_status='fully-paid'
        ).order_by('due_date')
        
        # Calculate days remaining for each debt
        debts_data = []
        for debt in debts:
            debt_dict = SaleSerializer(debt).data
            if debt.due_date:
                days_remaining = (debt.due_date - timezone.now()).days
                debt_dict['days_remaining'] = days_remaining
                debt_dict['is_near_due'] = debt.is_near_due()
                debt_dict['is_overdue'] = days_remaining < 0
            debts_data.append(debt_dict)
        
        return Response({
            'debts': debts_data,
            'count': debts.count()
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

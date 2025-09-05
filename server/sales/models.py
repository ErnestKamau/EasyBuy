from django.db import models
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

class Sales(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('fully-paid', 'Fully Paid'),
        ('partial', 'Partial'),
        ('debt', 'Debt'),
        ('overdue', 'Overdue'),
    ]
    
    
    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='sale'
    )
    sale_number = models.CharField(max_length=100, unique=True) # e.g., SALE-2025-001
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=15, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    cost_amount = models.DecimalField(max_digits=10, decimal_places=2)  
    profit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(choices=PAYMENT_STATUS_CHOICES, default='debt')
    due_date = models.DateTimeField(null=True) # set if debt/partial
    made_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_created=True)
    

    def __str__(self):
        return f"{self.sale_number} {self.customer_name} {self.total_amount} {self.made_on}"
    
    class Meta:
        db_table = 'sales'
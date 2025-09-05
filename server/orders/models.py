from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from accounts.models import User

class Order(models.Model):
    ORDER_STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='orders',
        null=True,
        blank=True
    )
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=15)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=ORDER_STATUS, default='pending')
    order_date = models.DateField(auto_now_add=True)
    order_time = models.TimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    @property
    def total_amount(self):
        """Calculate total order amount."""
        return sum(item.subtotal for item in self.items.all())
    
    def __str__(self):
        return f"{self.user} - ({self.notes}) ({self.order_time} {self.order_date})"
        
    
    class Meta:
        db_table = 'orders'
        



    
    
        
    
    
    
    
    
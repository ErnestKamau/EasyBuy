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
        return f"{self.user.username} - ({self.notes}) ({self.order_time} {self.order_date})"
        
    
    class Meta:
        db_table = 'orders'
        


class OrderItems(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField(default=0)
    kilogram = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal(0.00))] # Snapshot of price per product at order time
    )
    notes = models.TextField(blank=True)
    
    @property
    def subtotal(self):
        if self.kilogram:
            return self.unit_price * self.kilogram
        else:
            return self.quantity * self.unit_price
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    class Meta:
        db_table = 'order_items'
    
    
        
    
    
    
    
    
from django.db import models
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from django.core.validators import MinValueValidator

class Sale(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('fully-paid', 'Fully Paid'),
        ('partial', 'Partial'),
        ('no-payment', 'No Payment'),
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
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=MinValueValidator[Decimal(0.00)]
    )
    cost_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=MinValueValidator[Decimal(0.00)]
    )  
    profit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=MinValueValidator[Decimal(0.00)]
    )
    payment_status = models.CharField(choices=PAYMENT_STATUS_CHOICES, default='debt')
    due_date = models.DateTimeField(null=True) # set if debt/partial
    made_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_created=True)
    
    @property
    def total_paid(self):
        return sum(payment.amount for payment in self.payments.all()) #Sum of all payments for this sale
    
    @property
    def balance(self):
        return self.total_amount - self.total_paid
    
    @property
    def is_fully_paid(self): # Returns True if balance is zero or negative (overpaid)
        return self.balance <= Decimal(0.00) 
    
    def update_payment_status(self): # Auto-update status based on payments
        total_paid = self.total_paid
        
        if total_paid >= self.total_amount:
            self.payment_status = "fully-paid"
        elif self.due_date and timezone.now() > self.due_date:
            self.payment_status = "overdue"  
        elif total_paid > 0:
            self.payment_status = "partial"
        else:
            self.payment_status = "no-payment"
        
        self.updated_at = timezone.now()
        self.save()
        
    def set_as_debt(self, days=7): # Mark sale as debt with deadline.
        if self.payment_status in ["no-payment", "partial"]:
            self.due_date = timezone.now() + timedelta(days=days)
            self.save()
    
    def is_near_due(self): # Returns True if payment is due within 2 days
       if self.payment_status in ["no-payment", "partial"] and self.due_date:
           return (self.due_date - timezone.now()).days <= 2
       return False

    def __str__(self):
        return f"{self.sale_number} {self.customer_name} {self.total_amount} {self.made_on}"
    
    class Meta:
        db_table = 'sales'
        
        
class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='sale_items'
    )
    quantity = models.PositiveIntegerField(default=0)
    # Protects against price changes after the sale
    unit_price = models.DecimalField(
        # What you sold it for (at time of sale)
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal(0.00))]
    )
    sale_price = models.DecimalField(
        # What you paid for it (at time of sale)
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal(0.00))]
    )
    
    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    @property  
    def profit_total(self): # Total profit for an item
        return (self.unit_price - self.cost_price) * self.quantity
    
    
    def __str__(self):
        return f'{self.product.name} x {self.quantity}'
    
    class Meta:
        db_table = 'sale_items'
        
        
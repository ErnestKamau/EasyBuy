from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

class MpesaTransaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'), # Payment request sent to user's phone, waiting for response
        ('success', 'Success'), # User entered PIN and payment completed
        ('failed', 'Failed'), #  Payment failed (insufficient funds, wrong PIN, etc.)
        ('cancelled', 'Cancelled'), # User cancelled the payment prompt
    ]
    
    transaction_id = models.CharField(max_length=200, primary_key=True)
    checkout_request_id = models.CharField(max_length=100, unique=True) # When you initiate an STK Push (the payment popup on user's phone), M-Pesa gives you a CheckoutRequestID to track that specific request.
    merchant_request_id = models.CharField(max_length=100, blank=True)
    account_reference = models.CharField(max_length=100, blank=True) # M-Pesa assigns this when you make the payment request. Less commonly used but part of M-Pesa's response.
    payment = models.OneToOneField(
        'sales.Payment',
        on_delete=models.CASCADE,
        related_name='mpesa_transaction'
    )
    
    # What is sent to M-Pesa:
    amount = models.DecimalField(max_digits=10, decimal_places=2) #  How much money to request
    phone_number = models.CharField(max_length=15) #  Customer's phone number (format: 254712345678)
    transaction_desc = models.CharField(max_length=200, blank=True) # Description shown to customer
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending') # Starts as 'pending', updates based on M-Pesa response
    
    # # M-Pesa Response Fields
    mpesa_receipt_number = models.CharField(max_length=200, blank=True) # M-Pesa's confirmation code: When payment succeeds, M-Pesa provides a receipt number (like "QK7XQWERTY"). Customer sees this in their SMS.
    transaction_date = models.DateTimeField(null=True, blank=True) # M-Pesa tells you exactly when they processed the payment (may be different from when you requested it).
    result_code = models.IntegerField(null=True, blank=True) # Numeric code (0 = success, anything else = error)
    result_desc = models.CharField(max_length=200, blank=True) # Human-readable description ("The service request is processed successfully" or error details)
    
    created_at = models.DateTimeField(auto_now_add=True) # This is when your system initiated the M-Pesa request, not when M-Pesa processed it.
    
    
    @property
    def sale(self): # Get the sale this transaction belongs to via payment
        return self.payment.sale if self.payment else None
    
    def __str__(self):
        return f'M-Pesa {self.transaction_id}'
    
    class Meta:
        db_table = 'mpesa_transactions'

# Backwards compatibility: some modules expect MpesaPayment model name
MpesaPayment = MpesaTransaction
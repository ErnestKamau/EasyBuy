from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'


class Product(models.Model):
        name = models.CharField(max_length=120)
        image_url = models.CharField(max_length=500, blank=True, null=True)
        category = models.ForeignKey(
            Category,
            on_delete=models.CASCADE,
            related_name='products'
        )
        description = models.TextField(blank=True)
        kilograms = models.DecimalField(
            max_digits=8,
            decimal_places=3,
            null=True,
            blank=True,
            validators=[MinValueValidator(Decimal('0.001'))]
        )
        sale_price = models.DecimalField(
            max_digits=10,
            decimal_places=2,
            validators=[MinValueValidator(Decimal(0.00))]
        )
        cost_price = models.DecimalField(
            max_digits=10,
            decimal_places=2,
            validators=[MinValueValidator(Decimal(0.00))]
        )
        in_stock = models.PositiveIntegerField(default=0)
        minimum_stock = models.PositiveIntegerField(default=5) # Alert threshold - when stock drops to this level, you know to reorder
        is_active = models.BooleanField(default=True)
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
        
        
        
        
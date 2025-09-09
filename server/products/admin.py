from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'sale_price', 'cost_price', 'in_stock', 'is_low_stock', 'is_active']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['profit_margin', 'is_low_stock']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description', 'image_url')
        }),
        ('Pricing', {
            'fields': ('sale_price', 'cost_price', 'profit_margin')
        }),
        ('Inventory', {
            'fields': ('in_stock', 'minimum_stock', 'is_low_stock', 'kilograms')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    def profit_margin(self, obj):
        return f"{obj.profit_margin:.2f}%"
    profit_margin.short_description = 'Profit Margin'
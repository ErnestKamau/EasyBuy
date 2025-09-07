from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='categories'),
    path('products/', views.ProductListCreateView.as_view(), name='products'),
    path('products/low-stock/', views.low_stock_products, name='low-stock'),
]
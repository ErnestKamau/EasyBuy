from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Customer endpoints (read-only)
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    
    # Admin endpoints (write operations)
    path('admin/categories/', views.CategoryCreateView.as_view(), name='category-create'),
    path('admin/products/', views.ProductCreateView.as_view(), name='product-create'),
    path('admin/products/<int:pk>/', views.ProductUpdateDeleteView.as_view(), name='product-update-delete'),
]
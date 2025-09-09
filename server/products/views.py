from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from .permissions import IsAdmin, IsReadOnly


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsReadOnly]
    

class CategoryCreateView(generics.CreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.active()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_low_stock']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.search(search)
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.active()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsReadOnly]
    
class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
class ProductUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView): # ADMIN/SHOPKEEPER: Can update/delete products
    queryset = Product.objects.all    
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    



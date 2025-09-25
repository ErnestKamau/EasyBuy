from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, 
    create_order, 
    get_order_details, 
    get_pending_orders
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Custom endpoints
    path('create/', create_order, name='create_order'),
    path('<int:order_id>/details/', get_order_details, name='order_details'),
    path('admin/pending/', get_pending_orders, name='pending_orders'),
]

# This creates these URLs automatically:

# GET /api/orders/ - List all orders
# POST /api/orders/ - Create order
# GET /api/orders/1/ - Get specific order
# PUT /api/orders/1/ - Update order
# DELETE /api/orders/1/ - Delete order
# POST /api/orders/1/confirm/ - Confirm order (custom action)
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
urlpatterns = router.urls

# This creates these URLs automatically:

# GET /api/orders/ - List all orders
# POST /api/orders/ - Create order
# GET /api/orders/1/ - Get specific order
# PUT /api/orders/1/ - Update order
# DELETE /api/orders/1/ - Delete order
# POST /api/orders/1/confirm/ - Confirm order (custom action)
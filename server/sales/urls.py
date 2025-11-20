from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SaleViewSet,
    get_sales_analytics,
    get_overdue_payments,
    get_payment_summary,
    get_unpaid_sales,
    get_debts
)

router = DefaultRouter()
router.register(r'sales', SaleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Analytics endpoints
    path('analytics/', get_sales_analytics, name='sales_analytics'),
    path('overdue/', get_overdue_payments, name='overdue_payments'),
    path('payments/summary/', get_payment_summary, name='payment_summary'),
    path('unpaid/', get_unpaid_sales, name='unpaid_sales'),
    path('debts/', get_debts, name='debts'),
]

# This creates these URLs automatically:
# GET /api/sales/sales/ - List all sales
# GET /api/sales/sales/1/ - Get specific sale
# POST /api/sales/sales/1/add_payment/ - Add payment to sale
# GET /api/sales/analytics/ - Get sales analytics
# GET /api/sales/overdue/ - Get overdue sales
# GET /api/sales/payments/summary/ - Get payment summary
# GET /api/sales/unpaid/ - Get unpaid sales

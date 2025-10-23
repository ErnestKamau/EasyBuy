from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_stk_push, name='mpesa-initiate'),
    path('callback/', views.callback, name='mpesa-callback'),
]
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
import requests
import base64
import json

from orders.models import Order
from .models import MpesaPayment

def generate_access_token():
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    api_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    auth_string = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_string}"
    }
    
    try:
        response = requests.get(api_URL, headers=headers)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Error generating access token: {str(e)}")
        return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_stk_push(request):
    try:
        order_id = request.data.get('order_id')
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        
        if not all([order_id, phone_number, amount]):
            return JsonResponse({
                'error': 'Missing required parameters'
            }, status=400)
            
        order = Order.objects.get(id=order_id)
        if not order:
            return JsonResponse({'error': 'Order not found'}, status=404)
        
        # Format phone number (remove leading 0 or +254)
        phone_number = phone_number.replace("+", "")
        if phone_number.startswith("0"):
            phone_number = "254" + phone_number[1:]
        elif not phone_number.startswith("254"):
            phone_number = "254" + phone_number
            
        # Get access token
        access_token = generate_access_token()
        if not access_token:
            return JsonResponse({'error': 'Failed to generate access token'}, status=500)
            
        # Prepare STK Push
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode('utf-8')
        
        stk_push_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)),
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": f"Order-{order_id}",
            "TransactionDesc": f"Payment for Order #{order_id}"
        }
        
        response = requests.post(stk_push_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            # Save the payment request
            data = response.json()
            MpesaPayment.objects.create(
                order=order,
                phone_number=phone_number,
                amount=amount,
                merchant_request_id=data.get('MerchantRequestID'),
                checkout_request_id=data.get('CheckoutRequestID')
            )
            return JsonResponse(data)
        else:
            return JsonResponse({
                'error': 'Failed to initiate payment',
                'details': response.text
            }, status=response.status_code)
        
        access_token = generate_access_token()
        if not access_token:
            return JsonResponse({
                'error': 'Could not generate access token'
            }, status=500)
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)),
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": f"{settings.BASE_URL}/api/mpesa/callback/",
            "AccountReference": f"EasyBuy-{order_id}",
            "TransactionDesc": f"Payment for order #{order_id}"
        }
        
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers
        )
        
        return JsonResponse(response.json())
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

def process_callback_metadata(callback_metadata):
    """Extract payment details from callback metadata"""
    if not callback_metadata or not isinstance(callback_metadata.get("Item", []), list):
        return None
    
    items = {item.get("Name"): item.get("Value") for item in callback_metadata.get("Item", [])}
    return {
        "amount": items.get("Amount", 0),
        "mpesa_receipt_number": items.get("MpesaReceiptNumber", ""),
        "transaction_date": items.get("TransactionDate"),
        "phone_number": items.get("PhoneNumber", "")
    }

@api_view(['POST'])
def callback(request):
    """Handle M-Pesa callback"""
    try:
        # Validate callback data structure
        data = json.loads(request.body)
        if not data.get("Body", {}).get("stkCallback"):
            return JsonResponse({"success": False, "message": "Invalid callback format"}, status=400)
        
        result = data["Body"]["stkCallback"]
        result_code = result.get("ResultCode")
        
        # Extract payment details
        payment_details = process_callback_metadata(result.get("CallbackMetadata")) if result_code == 0 else {}
        
        # Create payment record
        MpesaPayment.objects.create(
            merchant_request_id=result.get("MerchantRequestID"),
            checkout_request_id=result.get("CheckoutRequestID"),
            result_code=result_code,
            result_desc=result.get("ResultDesc"),
            amount=payment_details.get("amount", 0),
            mpesa_receipt_number=payment_details.get("mpesa_receipt_number", ""),
            transaction_date=payment_details.get("transaction_date"),
            phone_number=payment_details.get("phone_number", "")
        )
        
        # Update order status if payment successful
        if result_code == 0:
            try:
                order_reference = result.get("AccountReference", "")
                if "-" in order_reference:
                    order_id = order_reference.split("-")[1]
                    order = Order.objects.get(id=order_id)
                    order.payment_status = 'PAID'
                    order.save()
            except (Order.DoesNotExist, IndexError):
                return JsonResponse({
                    "success": True,
                    "message": "Payment recorded but order not found"
                })
        
        return JsonResponse({
            "success": True,
            "message": "Payment processed successfully",
            "result_code": result_code
        })
            
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)
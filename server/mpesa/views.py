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
        
        # Format phone number (remove leading 0 or +254)
        phone_number = phone_number.replace("+", "")
        if phone_number.startswith("0"):
            phone_number = "254" + phone_number[1:]
        elif not phone_number.startswith("254"):
            phone_number = "254" + phone_number
        
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

@api_view(['POST'])
def callback(request):
    try:
        data = json.loads(request.body)
        
        if "Body" in data and "stkCallback" in data["Body"]:
            result = data["Body"]["stkCallback"]
            
            payment = MpesaPayment.objects.create(
                merchant_request_id=result.get("MerchantRequestID"),
                checkout_request_id=result.get("CheckoutRequestID"),
                result_code=result.get("ResultCode"),
                result_desc=result.get("ResultDesc"),
                amount=result["CallbackMetadata"]["Item"][0]["Value"] if result.get("ResultCode") == 0 else 0,
                mpesa_receipt_number=result["CallbackMetadata"]["Item"][1]["Value"] if result.get("ResultCode") == 0 else "",
                transaction_date=result["CallbackMetadata"]["Item"][3]["Value"] if result.get("ResultCode") == 0 else None,
                phone_number=result["CallbackMetadata"]["Item"][4]["Value"] if result.get("ResultCode") == 0 else ""
            )
            
            # Update order if payment is successful
            if result.get("ResultCode") == 0:
                try:
                    # Extract order_id from AccountReference (format: "EasyBuy-{order_id}")
                    order_reference = result.get("AccountReference", "")
                    order_id = order_reference.split("-")[1] if "-" in order_reference else None
                    
                    if order_id:
                        order = Order.objects.get(id=order_id)
                        order.payment_status = 'PAID'
                        order.save()
                except Order.DoesNotExist:
                    pass
            
            return JsonResponse({
                "success": True,
                "message": "Payment processed successfully"
            })
            
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)
    
    return JsonResponse({
        "success": True,
        "message": "Invalid callback data"
    })
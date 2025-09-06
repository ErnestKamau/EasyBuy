from django.shortcuts import render
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User,
        fields = ['id', 'username', 'email', 'phone_number', 'gender', 'role', 'is_active']




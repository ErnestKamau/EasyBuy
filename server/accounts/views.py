from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User,
        fields = ['id', 'username', 'email', 'phone_number', 'gender', 'role', 'is_active']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User,
        fields = ['username', 'email', 'phone_number', 'gender', 'role', 'password', 'password_confirm']
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user
    
    


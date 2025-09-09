from rest_framework.permissions import BasePermission

class IsReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.role in ['admin']
    
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['admin']
    

            
        
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOrderOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.user == request.user or request.user.role == 'admin'
        # For write/delete
        return obj.user == request.user or request.user.role == 'admin'
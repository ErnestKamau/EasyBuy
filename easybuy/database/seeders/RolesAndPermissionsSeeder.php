<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions
        $permissionNames = [
            'manage orders',
            'assign drivers',
            'deliver orders',
            'view tracking',
            'manage inventory',
        ];

        // Create permissions for both guards
        foreach ($permissionNames as $name) {
            Permission::findOrCreate($name, 'web');
            Permission::findOrCreate($name, 'api');
        }

        // --- Create Roles and Assign Permissions ---

        // ADMIN
        $adminWeb = Role::findOrCreate('admin', 'web');
        $adminApi = Role::findOrCreate('admin', 'api');
        $adminWeb->givePermissionTo(Permission::where('guard_name', 'web')->get());
        $adminApi->givePermissionTo(Permission::where('guard_name', 'api')->get());

        // RIDER
        $riderWeb = Role::findOrCreate('rider', 'web');
        $riderApi = Role::findOrCreate('rider', 'api');
        $riderPermissions = ['deliver orders', 'view tracking'];
        $riderWeb->givePermissionTo($riderPermissions);
        $riderApi->givePermissionTo($riderPermissions);

        // CUSTOMER
        $customerWeb = Role::findOrCreate('customer', 'web');
        $customerApi = Role::findOrCreate('customer', 'api');
        $customerPermissions = ['view tracking'];
        $customerWeb->givePermissionTo($customerPermissions);
        $customerApi->givePermissionTo($customerPermissions);

        // --- sync existing users ---
        User::all()->each(function ($user) {
            // First, remove existing roles if any to start clean
            $user->roles()->detach();
            $user->permissions()->detach();

            if ($user->role === 'admin') {
                $user->assignRole('admin');
            } elseif ($user->role === 'rider' || $user->role === 'transporter') {
                $user->assignRole('rider');
            } else {
                $user->assignRole('customer');
            }
        });
    }
}

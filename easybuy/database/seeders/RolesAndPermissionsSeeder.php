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

        // Create permissions
        foreach ($permissionNames as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // --- Create Roles and Assign Permissions ---

        // ADMIN
        $admin = Role::findOrCreate('admin', 'web');
        $admin->givePermissionTo(Permission::where('guard_name', 'web')->get());

        // RIDER
        $rider = Role::findOrCreate('rider', 'web');
        $riderPermissions = ['deliver orders', 'view tracking'];
        $rider->givePermissionTo($riderPermissions);

        // CUSTOMER
        $customer = Role::findOrCreate('customer', 'web');
        $customerPermissions = ['view tracking'];
        $customer->givePermissionTo($customerPermissions);

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

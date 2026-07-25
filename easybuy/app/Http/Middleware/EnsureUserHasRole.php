<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Restrict the request to users whose role is in the allowed list.
     * Usage: middleware('role:rider') or middleware('role:admin,rider')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}

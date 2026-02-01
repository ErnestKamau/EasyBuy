<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Get paginated wallet transactions for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $query = WalletTransaction::where('user_id', $request->user()->id)
            ->with(['order', 'sale']) // Load related models for context
            ->orderBy('created_at', 'desc');

        // Filter by type (credit, debit)
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Get wallet summary (balance, total spent, total credited)
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Calculate totals from transactions
        $totalCredited = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->sum('amount');
            
        $totalDebited = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'debit')
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'current_balance' => $user->wallet_balance,
                'total_credited' => $totalCredited,
                'total_spent' => $totalDebited,
                'currency' => 'KES'
            ]
        ]);
    }
}

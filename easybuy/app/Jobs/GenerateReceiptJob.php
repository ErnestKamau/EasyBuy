<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Services\ReceiptService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateReceiptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sale;

    /**
     * Create a new job instance.
     */
    public function __construct(Sale $sale)
    {
        $this->sale = $sale;
    }

    /**
     * Execute the job.
     */
    public function handle(ReceiptService $receiptService): void
    {
        try {
            $receiptService->generateReceipt($this->sale);
            Log::info('Receipt generated successfully', ['sale_id' => $this->sale->id]);
        } catch (\Exception $e) {
            Log::error('Failed to generate receipt', [
                'sale_id' => $this->sale->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}

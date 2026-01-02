<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Jobs\GenerateReceiptJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class GenerateReceipt implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(SaleCreated $event): void
    {
        // Dispatch job to generate receipt asynchronously
        GenerateReceiptJob::dispatch($event->sale);
    }
}

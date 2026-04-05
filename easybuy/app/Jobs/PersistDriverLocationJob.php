<?php

namespace App\Jobs;

use App\Models\DriverLocation;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PersistDriverLocationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Async job that writes a single GPS point to MySQL.
     *
     * Why async? The driver's HTTP response returns immediately after Redis is updated.
     * This job runs a few milliseconds later in the background via Redis queue.
     * This keeps the GPS endpoint < 20ms regardless of database load.
     *
     * If this job fails, it will retry up to 3 times automatically.
     */
    public int $tries = 3;
    public int $backoff = 5; // seconds between retries

    public function __construct(
        public readonly int    $driverId,
        public readonly float  $lat,
        public readonly float  $lng,
        public readonly float  $heading,
        public readonly float  $speed,
        public readonly ?int   $orderId,
        public readonly Carbon $recordedAt
    ) {}

    public function handle(): void
    {
        DriverLocation::create([
            'driver_id'   => $this->driverId,
            'order_id'    => $this->orderId,
            'latitude'    => $this->lat,
            'longitude'   => $this->lng,
            'heading'     => $this->heading,
            'speed'       => $this->speed,
            'recorded_at' => $this->recordedAt,
        ]);
    }
}

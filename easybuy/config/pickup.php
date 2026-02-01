<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Pickup Time Slots
    |--------------------------------------------------------------------------
    |
    | Define available pickup time slots with maximum capacity per slot.
    | Time is in 24-hour format (HH:MM).
    | Operating hours: 3:30 PM - 6:00 AM (overnight operation)
    |
    */
    'slots' => [
        // Afternoon/Evening slots
        '15:30' => ['label' => '3:30 PM - 4:30 PM', 'max_orders' => 10],
        '16:30' => ['label' => '4:30 PM - 5:30 PM', 'max_orders' => 10],
        '17:30' => ['label' => '5:30 PM - 6:30 PM', 'max_orders' => 12],
        '18:30' => ['label' => '6:30 PM - 7:30 PM', 'max_orders' => 12],
        '19:30' => ['label' => '7:30 PM - 8:30 PM', 'max_orders' => 15], // Peak
        '20:30' => ['label' => '8:30 PM - 9:30 PM', 'max_orders' => 15], // Peak
        '21:30' => ['label' => '9:30 PM - 10:30 PM', 'max_orders' => 12],
        '22:30' => ['label' => '10:30 PM - 11:30 PM', 'max_orders' => 10],
        '23:30' => ['label' => '11:30 PM - 12:30 AM', 'max_orders' => 8],
        
        // Late night/Early morning slots
        '00:30' => ['label' => '12:30 AM - 1:30 AM', 'max_orders' => 15],
        '01:30' => ['label' => '1:30 AM - 2:30 AM', 'max_orders' => 15],
        '02:30' => ['label' => '2:30 AM - 3:30 AM', 'max_orders' => 15],
        '03:30' => ['label' => '3:30 AM - 4:30 AM', 'max_orders' => 15],
        '04:30' => ['label' => '4:30 AM - 5:30 AM', 'max_orders' => 15],
        '05:30' => ['label' => '5:30 AM - 6:00 AM', 'max_orders' => 15],
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-Cancel Configuration
    |--------------------------------------------------------------------------
    */
    'auto_cancel_hours' => 12, // Hours after pickup_time before auto-cancel

    /*
    |--------------------------------------------------------------------------
    | Reminder Configuration
    |--------------------------------------------------------------------------
    */
    'reminder_hours' => 1, // Hours before pickup_time to send reminder
];

<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Daily: flag overdue tasks and fire task_overdue automation rules
        $schedule->command('crm:scan-overdue-tasks')->dailyAt('07:00');

        // Daily: flag leads with no activity in 7+ days
        $schedule->command('crm:scan-idle-leads')->dailyAt('07:05');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum', 'company.tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Users (company members)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/insights', [InsightsController::class, 'index']);
    Route::get('/onboarding', [OnboardingController::class, 'index']);

    // Search
    Route::get('/search', [SearchController::class, 'index']);

    // Leads
    Route::get('/leads/export', [LeadController::class, 'exportCsv']);
    Route::apiResource('/leads', LeadController::class);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

    // Clients
    Route::get('/clients/export', [ClientController::class, 'exportCsv']);
    Route::apiResource('/clients', ClientController::class);

    // Tasks
    Route::apiResource('/tasks', TaskController::class);

    // Activities
    Route::get('/activities', [ActivityController::class, 'index']);

    // Files
    Route::get('/files', [FileController::class, 'index']);
    Route::post('/files', [FileController::class, 'store']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);
    Route::get('/files/{file}/download', [FileController::class, 'download']);

    // Automations
    Route::apiResource('/automations', AutomationController::class)->only([
        'index', 'store', 'update', 'destroy',
    ]);
});

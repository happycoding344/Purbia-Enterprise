<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PdfController;

use App\Http\Controllers\Api\MasterController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\LrController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('invoices', InvoiceController::class);

    // New Modules
    Route::get('/masters/{type}', [MasterController::class, 'index']);
    Route::post('/masters/{type}', [MasterController::class, 'store']);
    Route::apiResource('vehicles', VehicleController::class);
    Route::apiResource('lrs', LrController::class);

    Route::get('/invoices/{invoice}/pdf-data', [PdfController::class, 'generateInvoice']);
});

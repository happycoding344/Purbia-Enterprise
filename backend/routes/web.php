<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    $path = public_path('index.html');
    if (file_exists($path)) {
        return response(file_get_contents($path))->header('Content-Type', 'text/html');
    }
    return view('welcome');
})->where('any', '^(?!api|assets|vite\.svg|favicon\.ico|robots\.txt).*$');

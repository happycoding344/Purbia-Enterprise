<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'inward_date',
        'outward_date',
        'company',
        'location',
        'truck_no',
        'lr_no',
        'manifest_details',
        'distance',
        'rate',
        'detention',
        'detention_rate',
        'total',
    ];

    protected $casts = [
        'inward_date' => 'datetime',
        'outward_date' => 'datetime',
        'distance' => 'decimal:2',
        'rate' => 'decimal:2',
        'detention' => 'decimal:2',
        'detention_rate' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}

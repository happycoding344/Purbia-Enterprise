<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'description',
        'sac_code',
        'qty',
        'unit',
        'rate',
        'amount',
        'cgst',
        'sgst',
        'total',
        // PI Industries specific fields
        'lr_id',
        'lr_no',
        'distance_range',
        'qty_display',
        'actual_qty',
        'detention_days',
        'detention_rate',
        'detention_amount',
    ];

    protected $casts = [
        'qty' => 'decimal:2',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'cgst' => 'decimal:2',
        'sgst' => 'decimal:2',
        'total' => 'decimal:2',
        // 'qty_display' is now a string to allow custom text (e.g., "10 MT")
        'actual_qty' => 'decimal:2',
        'detention_days' => 'decimal:2',
        'detention_rate' => 'decimal:2',
        'detention_amount' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}

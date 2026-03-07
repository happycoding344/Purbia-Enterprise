<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'invoice_no',
        'invoice_date',
        'po_number',
        'state_name',
        'state_code',
        'due_date',
        'purbia_gstin',
        'purbia_pan',
        'bank_name',
        'branch',
        'ifsc',
        'account_number',
        'subtotal_amount',
        'cgst_amount',
        'sgst_amount',
        'grand_total',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }
}

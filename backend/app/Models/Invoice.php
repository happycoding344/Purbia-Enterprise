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
        'business_type',
        'invoice_no',
        'invoice_date',
        'billing_party_id',
        'delivery_address',
        'state_id',
        'state_code',
        'gst_number',
        'po_number',
        'payment_due_date',
        'subject',
        'hsn_code',
        'amount',
        'gst_amount',
        'sgst_amount',
        'cgst_amount',
        'total_amount',
        'total_amount_words',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'payment_due_date' => 'date',
        'amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function billingParty(): BelongsTo
    {
        return $this->belongsTo(BillingParty::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function lrs()
    {
        return $this->belongsToMany(Lr::class, 'invoice_lrs');
    }

    public function attachments()
    {
        return $this->hasMany(InvoiceAttachment::class);
    }
}

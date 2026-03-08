<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceLr extends Model
{
    use HasFactory;

    protected $table = 'invoice_lrs';

    protected $fillable = [
        'invoice_id',
        'lr_id',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function lr()
    {
        return $this->belongsTo(Lr::class, 'lr_id');
    }
}

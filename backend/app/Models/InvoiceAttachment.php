<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'file_path',
        'original_name',
        'file_type',
        'file_size',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}

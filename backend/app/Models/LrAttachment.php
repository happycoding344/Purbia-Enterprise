<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LrAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lr_id',
        'file_path',
        'file_name',
        'file_size',
    ];

    public function lr()
    {
        return $this->belongsTo(Lr::class);
    }
}

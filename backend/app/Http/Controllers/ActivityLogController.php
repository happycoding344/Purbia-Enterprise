<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get recent activity logs
     */
    public function index(Request $request)
    {
        $limit = $request->query('limit', 50);

        $logs = ActivityLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($logs);
    }

    /**
     * Get activity logs for dashboard (recent 10)
     */
    public function dashboard()
    {
        $logs = ActivityLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($logs);
    }

    /**
     * Get activity logs filtered by model type
     */
    public function byModel(Request $request, string $modelType)
    {
        $logs = ActivityLog::with('user:id,name,email')
            ->where('model_type', $modelType)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}

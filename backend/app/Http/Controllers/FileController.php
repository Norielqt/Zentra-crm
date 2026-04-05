<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Services\ActivityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'related_type' => 'required|string',
            'related_id'   => 'required|integer',
        ]);

        $files = File::where('company_id', $request->user()->company_id)
            ->where('related_type', $request->related_type)
            ->where('related_id', $request->related_id)
            ->get();

        return response()->json($files);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file'         => 'required|file|max:20480',
            'related_type' => 'required|string',
            'related_id'   => 'required|integer',
        ]);

        $uploaded = $request->file('file');
        $path = $uploaded->store("companies/{$request->user()->company_id}/files", 'local');

        $file = File::create([
            'company_id'    => $request->user()->company_id,
            'user_id'       => $request->user()->id,
            'original_name' => $uploaded->getClientOriginalName(),
            'file_path'     => $path,
            'mime_type'     => $uploaded->getClientMimeType(),
            'file_size'     => $uploaded->getSize(),
            'related_type'  => $request->related_type,
            'related_id'    => $request->related_id,
        ]);

        ActivityService::log(
            'file_uploaded',
            "File uploaded: {$file->original_name}",
            $file->related_type,
            $file->related_id
        );

        return response()->json($file, 201);
    }

    public function destroy(Request $request, File $file)
    {
        if ($file->company_id !== $request->user()->company_id) {
            abort(403);
        }

        Storage::disk('local')->delete($file->file_path);
        $file->delete();

        return response()->json(['message' => 'File deleted.']);
    }

    public function download(Request $request, File $file)
    {
        if ($file->company_id !== $request->user()->company_id) {
            abort(403);
        }

        return Storage::disk('local')->download($file->file_path, $file->original_name);
    }
}


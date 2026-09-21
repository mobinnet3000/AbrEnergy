'use client';
import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axios';
import { toast } from 'sonner';

interface DocumentUploadProps {
  onUpload: (url: string, fileId?: string, fileName?: string) => void;
  currentUrl?: string;
  fileName?: string;
  label?: string;
}

/** PDF-only upload for product documents (backend validates %PDF- magic + 25 MB). */
export function DocumentUpload({ onUpload, currentUrl, fileName, label = 'Upload PDF' }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', 'documents');
      const res = await axiosInstance.post('/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpload(res.data.file as string, res.data.id as string, file.name);
      toast.success('سند بارگذاری شد');
    } catch {
      toast.error('بارگذاری سند ناموفق بود');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onUpload('', '', '');
    if (inputRef.current) inputRef.current.value = '';
  };

  if (currentUrl) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20">
        <FileText className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs truncate flex-1 hover:underline"
          dir="ltr"
        >
          {fileName || currentUrl}
        </a>
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 rounded hover:bg-muted shrink-0"
          aria-label="Remove document"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/20 px-3 py-4"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} className="hidden" />
    </div>
  );
}

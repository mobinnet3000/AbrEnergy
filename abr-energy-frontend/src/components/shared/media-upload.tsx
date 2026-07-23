'use client';
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MediaUploadProps {
  onUpload: (url: string, fileId?: string) => void;
  currentImage?: string;
  accept?: string;
  label?: string;
}

export function MediaUpload({ onUpload, currentImage, accept = 'image/*', label = 'Upload Image' }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview locally
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', 'articles');

      const res = await axiosInstance.post('/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = res.data.file;
      const fileId = res.data.id;
      setPreview(fileUrl);
      onUpload(fileUrl, fileId);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
      setPreview(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onUpload('', '');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {preview ? (
        <div className="relative w-full max-w-xs aspect-video rounded-lg border overflow-hidden bg-muted/30 group">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full max-w-xs aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/20"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}

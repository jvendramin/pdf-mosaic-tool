
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File } from "lucide-react";
import { usePDFContext } from './PDFContext';
import { cn } from '@/lib/utils';

const PDFUploader: React.FC = () => {
  const { uploadPDFs, loading } = usePDFContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadPDFs(files);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
      />
      
      <Card 
        className={cn(
          "border-2 border-dashed border-muted p-10 text-center transition-all duration-200",
          "hover:border-cdl/70 cursor-pointer"
        )}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-muted p-4">
            {loading ? (
              <File className="h-8 w-8 text-cdl animate-pulse" />
            ) : (
              <Upload className="h-8 w-8 text-cdl" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload PDFs</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Drag and drop your PDF files here, or click to browse
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-2 border-cdl text-cdl hover:bg-cdl hover:text-white button-hover"
            disabled={loading}
          >
            {loading ? "Processing..." : "Select Files"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PDFUploader;

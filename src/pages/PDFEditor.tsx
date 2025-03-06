
import React from 'react';
import { PDFProvider } from '@/components/pdf-editor/PDFContext';
import PDFUploader from '@/components/pdf-editor/PDFUploader';
import PDFPageGrid from '@/components/pdf-editor/PDFPageGrid';
import PDFToolbar from '@/components/pdf-editor/PDFToolbar';

const PDFEditor: React.FC = () => {
  return (
    <PDFProvider>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">PDF Editor</h1>
              <p className="text-muted-foreground mt-1">
                Upload, manage, and merge PDF documents
              </p>
            </div>
          </div>
          
          <PDFUploader />
          <PDFToolbar />
          <PDFPageGrid />
        </div>
      </div>
    </PDFProvider>
  );
};

export default PDFEditor;

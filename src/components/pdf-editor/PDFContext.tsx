
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

export interface PDFPage {
  id: string;
  file: string;
  pageNumber: number;
  dataUrl: string;
  selected: boolean;
  originalFile: File;
}

interface PDFContextType {
  pages: PDFPage[];
  loading: boolean;
  exportFileName: string;
  setExportFileName: (name: string) => void;
  uploadPDFs: (files: FileList) => Promise<void>;
  togglePageSelection: (pageId: string) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  movePagesUp: (pageIds: string[]) => void;
  movePagesDown: (pageIds: string[]) => void;
  removeSelectedPages: () => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  exportPDF: () => Promise<void>;
  selectedPages: PDFPage[];
  selectPagesByArea: (pageIds: string[], select: boolean) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const usePDFContext = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error("usePDFContext must be used within a PDFProvider");
  }
  return context;
};

interface PDFProviderProps {
  children: ReactNode;
}

export const PDFProvider: React.FC<PDFProviderProps> = ({ children }) => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportFileName, setExportFileName] = useState(`merged_document_${new Date().toISOString().slice(0, 10)}`);
  const [pdfJsInitialized, setPdfJsInitialized] = useState(false);

  const selectedPages = pages.filter(page => page.selected);

  // Load PDF.js dynamically when the component mounts
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // Use a fixed, known-good CDN URL for the worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log("PDF.js initialized successfully with version:", pdfjsLib.version);
        setPdfJsInitialized(true);
      } catch (error) {
        console.error("Error initializing PDF.js:", error);
        toast.error("Failed to initialize PDF processing. Please refresh the page and try again.");
      }
    };
    
    loadPdfJs();
  }, []);

  const uploadPDFs = async (files: FileList) => {
    if (!pdfJsInitialized) {
      toast.error("PDF processor is not initialized yet. Please wait a moment and try again.");
      return;
    }
    
    setLoading(true);
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      const newPages: PDFPage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileUrl = URL.createObjectURL(file);
        
        try {
          // Load the PDF
          const pdf = await pdfjsLib.getDocument(fileUrl).promise;
          const numPages = pdf.numPages;
          
          for (let j = 1; j <= numPages; j++) {
            try {
              const page = await pdf.getPage(j);
              const viewport = page.getViewport({ scale: 1.0 });
              
              // Create a canvas for rendering
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (!context) {
                throw new Error("Could not get canvas context");
              }
              
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              // Render the PDF page on the canvas
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              // Convert the canvas to a data URL
              const dataUrl = canvas.toDataURL('image/png');
              
              newPages.push({
                id: `${file.name}-${j}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file: file.name,
                pageNumber: j,
                dataUrl,
                selected: true,
                originalFile: file
              });
            } catch (pageError) {
              console.error(`Error processing page ${j} of ${file.name}:`, pageError);
              toast.error(`Failed to process page ${j} of ${file.name}`);
            }
          }
        } catch (pdfError) {
          console.error(`Error processing PDF file ${file.name}:`, pdfError);
          toast.error(`Failed to process ${file.name}. The file might be corrupted or password-protected.`);
        } finally {
          // Clean up the URL object
          URL.revokeObjectURL(fileUrl);
        }
      }
      
      if (newPages.length > 0) {
        setPages(prevPages => [...prevPages, ...newPages]);
        toast.success(`${newPages.length} pages added successfully.`);
      } else {
        toast.error("No pages could be processed from the selected files.");
      }
    } catch (error) {
      console.error("Error processing PDFs:", error);
      toast.error("Failed to process PDFs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === pageId ? { ...page, selected: !page.selected } : page
      )
    );
  };

  const selectAllPages = () => {
    setPages(prevPages =>
      prevPages.map(page => ({ ...page, selected: true }))
    );
    toast.success("All pages selected");
  };

  const deselectAllPages = () => {
    setPages(prevPages =>
      prevPages.map(page => ({ ...page, selected: false }))
    );
    toast.success("All pages deselected");
  };

  const movePagesUp = (pageIds: string[]) => {
    if (pageIds.length === 0) return;
    
    const updatedPages = [...pages];
    
    pageIds.sort((a, b) => {
      const indexA = updatedPages.findIndex(p => p.id === a);
      const indexB = updatedPages.findIndex(p => p.id === b);
      return indexA - indexB;
    });
    
    for (const pageId of pageIds) {
      const index = updatedPages.findIndex(p => p.id === pageId);
      if (index > 0) {
        // Swap with the page above
        [updatedPages[index], updatedPages[index - 1]] = [updatedPages[index - 1], updatedPages[index]];
      }
    }
    
    setPages(updatedPages);
  };

  const movePagesDown = (pageIds: string[]) => {
    if (pageIds.length === 0) return;
    
    const updatedPages = [...pages];
    
    pageIds.sort((a, b) => {
      const indexA = updatedPages.findIndex(p => p.id === a);
      const indexB = updatedPages.findIndex(p => p.id === b);
      return indexB - indexA; // Note the reverse order for moving down
    });
    
    for (const pageId of pageIds) {
      const index = updatedPages.findIndex(p => p.id === pageId);
      if (index < updatedPages.length - 1) {
        // Swap with the page below
        [updatedPages[index], updatedPages[index + 1]] = [updatedPages[index + 1], updatedPages[index]];
      }
    }
    
    setPages(updatedPages);
  };

  const removeSelectedPages = () => {
    const selectedCount = pages.filter(page => page.selected).length;
    setPages(prevPages => prevPages.filter(page => !page.selected));
    toast.success(`${selectedCount} page(s) removed`);
  };

  const reorderPages = (startIndex: number, endIndex: number) => {
    const result = Array.from(pages);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setPages(result);
  };

  const selectPagesByArea = (pageIds: string[], select: boolean) => {
    setPages(prevPages =>
      prevPages.map(page => ({
        ...page,
        selected: pageIds.includes(page.id) ? select : page.selected
      }))
    );
    
    const actionText = select ? "selected" : "deselected";
    toast.success(`${pageIds.length} page(s) ${actionText}`);
  };

  const exportPDF = async () => {
    if (selectedPages.length === 0) {
      toast.error("No pages selected for export");
      return;
    }

    setLoading(true);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Group pages by their original file
      const pagesByFile = selectedPages.reduce((acc, page) => {
        const key = page.file;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(page);
        return acc;
      }, {} as Record<string, PDFPage[]>);
      
      // Process each file
      for (const [, filePages] of Object.entries(pagesByFile)) {
        if (filePages.length === 0) continue;
        
        // Sort pages by their original page number
        filePages.sort((a, b) => {
          const indexA = pages.findIndex(p => p.id === a.id);
          const indexB = pages.findIndex(p => p.id === b.id);
          return indexA - indexB;
        });
        
        try {
          const file = filePages[0].originalFile;
          const fileArrayBuffer = await file.arrayBuffer();
          const srcPdfDoc = await PDFDocument.load(fileArrayBuffer);
          
          for (const page of filePages) {
            try {
              // Copy the page from the source PDF
              const [copiedPage] = await pdfDoc.copyPages(srcPdfDoc, [page.pageNumber - 1]);
              pdfDoc.addPage(copiedPage);
            } catch (pageError) {
              console.error(`Error copying page ${page.pageNumber} from ${page.file}:`, pageError);
            }
          }
        } catch (fileError) {
          console.error(`Error processing file ${filePages[0].file} for export:`, fileError);
          toast.error(`Failed to process ${filePages[0].file} for export.`);
        }
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download the file with custom name
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${exportFileName}.pdf`;
      link.click();
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    pages,
    loading,
    exportFileName,
    setExportFileName,
    uploadPDFs,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    movePagesUp,
    movePagesDown,
    removeSelectedPages,
    reorderPages,
    exportPDF,
    selectedPages,
    selectPagesByArea
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
};

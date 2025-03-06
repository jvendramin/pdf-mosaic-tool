
import React from 'react';
import { Button } from "@/components/ui/button";
import { usePDFContext } from './PDFContext';
import { 
  ArrowUp, 
  ArrowDown, 
  CheckSquare, 
  Square, 
  Trash2, 
  Download,
  Loader2,
  MousePointer,
  Lasso
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PDFToolbar: React.FC = () => {
  const { 
    pages, 
    loading,
    selectedPages,
    selectionMode,
    setSelectionMode,
    exportFileName,
    setExportFileName,
    selectAllPages, 
    deselectAllPages, 
    movePagesUp, 
    movePagesDown,
    removeSelectedPages,
    exportPDF
  } = usePDFContext();

  const handleMoveUp = () => {
    const selectedIds = selectedPages.map(page => page.id);
    if (selectedIds.length === 0) {
      toast.error("No pages selected to move");
      return;
    }
    movePagesUp(selectedIds);
  };

  const handleMoveDown = () => {
    const selectedIds = selectedPages.map(page => page.id);
    if (selectedIds.length === 0) {
      toast.error("No pages selected to move");
      return;
    }
    movePagesDown(selectedIds);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
  };

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-4 mt-6">
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 sticky top-0 bg-background z-10 px-4 -mx-4">
        <div className="text-sm font-medium">
          {selectedPages.length} of {pages.length} pages selected
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        <Button 
          variant={selectionMode ? "default" : "outline"}
          size="sm" 
          onClick={toggleSelectionMode}
          className={cn(
            "flex items-center gap-1 button-hover",
            selectionMode && "bg-cdl hover:bg-cdl-dark"
          )}
        >
          {selectionMode ? (
            <MousePointer className="h-4 w-4" />
          ) : (
            <Lasso className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{selectionMode ? "Exit Selection" : "Area Select"}</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={selectAllPages}
          className="flex items-center gap-1 button-hover"
        >
          <CheckSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Select All</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={deselectAllPages}
          className="flex items-center gap-1 button-hover"
        >
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Deselect All</span>
        </Button>
        
        <Separator orientation="vertical" className="h-8" />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMoveUp}
          disabled={selectedPages.length === 0}
          className="flex items-center gap-1 button-hover"
        >
          <ArrowUp className="h-4 w-4" />
          <span className="hidden sm:inline">Move Up</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMoveDown}
          disabled={selectedPages.length === 0}
          className="flex items-center gap-1 button-hover"
        >
          <ArrowDown className="h-4 w-4" />
          <span className="hidden sm:inline">Move Down</span>
        </Button>
        
        <Separator orientation="vertical" className="h-8" />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={removeSelectedPages}
          disabled={selectedPages.length === 0}
          className="flex items-center gap-1 text-destructive hover:bg-destructive/10 button-hover"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Remove Selected</span>
        </Button>
        
        <div className="flex-1"></div>
      </div>

      <div className="flex flex-wrap items-end gap-4 pb-4">
        <div className="flex-1 min-w-[240px]">
          <Label htmlFor="export-filename" className="text-sm font-medium mb-2 block">
            Export Filename
          </Label>
          <Input
            id="export-filename"
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
            placeholder="Enter filename for export"
            className="w-full"
          />
        </div>

        <Button 
          variant="default" 
          size="sm" 
          onClick={exportPDF}
          disabled={loading || selectedPages.length === 0}
          className="flex items-center gap-1 bg-cdl hover:bg-cdl-dark button-hover ml-auto h-10"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>Export PDF</span>
        </Button>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default PDFToolbar;

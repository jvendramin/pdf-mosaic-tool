
import React, { useState } from 'react';
import { usePDFContext, PDFPage } from './PDFContext';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

const PDFPageGrid: React.FC = () => {
  const { pages, togglePageSelection } = usePDFContext();
  const [selectedForMove, setSelectedForMove] = useState<string[]>([]);
  
  const handleCheckboxChange = (pageId: string) => {
    togglePageSelection(pageId);
  };
  
  const handlePageClick = (pageId: string, e: React.MouseEvent) => {
    // Handle multi-selection with Shift or Ctrl key
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      setSelectedForMove(prev => {
        if (prev.includes(pageId)) {
          return prev.filter(id => id !== pageId);
        } else {
          return [...prev, pageId];
        }
      });
    }
  };
  
  if (pages.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-6 pb-6">
      {pages.map((page, index) => (
        <PageCard
          key={page.id}
          page={page}
          index={index}
          onCheckboxChange={handleCheckboxChange}
          onPageClick={handlePageClick}
          isSelectedForMove={selectedForMove.includes(page.id)}
        />
      ))}
    </div>
  );
};

interface PageCardProps {
  page: PDFPage;
  index: number;
  onCheckboxChange: (pageId: string) => void;
  onPageClick: (pageId: string, e: React.MouseEvent) => void;
  isSelectedForMove: boolean;
}

const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  onCheckboxChange,
  onPageClick,
  isSelectedForMove
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border pdf-page",
        isSelectedForMove && "ring-2 ring-cdl",
        page.selected ? "border-cdl" : "border-border"
      )}
      onClick={(e) => onPageClick(page.id, e)}
    >
      <div className="aspect-[3/4] relative">
        <img 
          src={page.dataUrl} 
          alt={`Page ${page.pageNumber} from ${page.file}`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-white/80 py-1 px-2 rounded text-xs">
          <span className="font-medium">{index + 1}</span>
        </div>
        
        <div className="absolute top-2 right-2 group-hover:opacity-100 opacity-80 transition-opacity">
          <Checkbox
            checked={page.selected}
            onCheckedChange={() => onCheckboxChange(page.id)}
            className="data-[state=checked]:bg-cdl data-[state=checked]:border-cdl"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-medium truncate">
            {page.file} - Page {page.pageNumber}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PDFPageGrid;

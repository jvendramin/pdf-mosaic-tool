
import React, { useState, useRef, useCallback } from 'react';
import { usePDFContext, PDFPage } from './PDFContext';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Grip } from 'lucide-react';

const PDFPageGrid: React.FC = () => {
  const { pages, togglePageSelection, reorderPages, selectionMode, selectPagesByArea } = usePDFContext();
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<Map<string, DOMRect>>(new Map());
  
  const handleCheckboxChange = (pageId: string) => {
    togglePageSelection(pageId);
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderPages(result.source.index, result.destination.index);
    setIsDragging(false);
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectionMode || !gridRef.current) return;
    
    // Only start selection with left mouse button
    if (e.button !== 0) return;
    
    const { left, top } = gridRef.current.getBoundingClientRect();
    const startX = e.clientX - left;
    const startY = e.clientY - top;
    
    setSelectionBox({
      startX,
      startY,
      endX: startX,
      endY: startY
    });
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!gridRef.current || !selectionBox) return;
      
      const endX = moveEvent.clientX - left;
      const endY = moveEvent.clientY - top;
      
      setSelectionBox({
        startX,
        startY,
        endX,
        endY
      });
    };
    
    const onMouseUp = () => {
      if (!selectionBox) return;
      
      // Determine which pages are within the selection box
      const selectionRect = {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        right: Math.max(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        bottom: Math.max(selectionBox.startY, selectionBox.endY)
      };
      
      const selectedPageIds: string[] = [];
      
      pagesRef.current.forEach((rect, pageId) => {
        if (
          rect.left < selectionRect.right &&
          rect.right > selectionRect.left &&
          rect.top < selectionRect.bottom &&
          rect.bottom > selectionRect.top
        ) {
          selectedPageIds.push(pageId);
        }
      });
      
      if (selectedPageIds.length > 0) {
        selectPagesByArea(selectedPageIds);
      }
      
      setSelectionBox(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [selectionMode, selectionBox, selectPagesByArea]);
  
  // Update page references whenever pages change
  const setPageRef = useCallback((pageId: string, element: HTMLDivElement | null) => {
    if (element) {
      pagesRef.current.set(pageId, element.getBoundingClientRect());
    } else {
      pagesRef.current.delete(pageId);
    }
  }, []);
  
  if (pages.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={gridRef}
      className="relative"
      onMouseDown={handleMouseDown}
    >
      {selectionBox && (
        <div
          className="absolute bg-cdl/20 border border-cdl z-10 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY)
          }}
        />
      )}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="pdf-pages" direction="horizontal">
          {(provided) => (
            <div 
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-6 pb-6",
                selectionMode && "cursor-crosshair"
              )}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {pages.map((page, index) => (
                <Draggable 
                  key={page.id} 
                  draggableId={page.id} 
                  index={index}
                  isDragDisabled={selectionMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={(el) => {
                        provided.innerRef(el);
                        setPageRef(page.id, el);
                      }}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        zIndex: snapshot.isDragging ? 1000 : undefined
                      }}
                    >
                      <PageCard
                        page={page}
                        index={index}
                        onCheckboxChange={handleCheckboxChange}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={isDragging}
                        isSelectionMode={selectionMode}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

interface PageCardProps {
  page: PDFPage;
  index: number;
  onCheckboxChange: (pageId: string) => void;
  dragHandleProps: any;
  isDragging: boolean;
  isSelectionMode: boolean;
}

const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  onCheckboxChange,
  dragHandleProps,
  isDragging,
  isSelectionMode
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border pdf-page",
        page.selected ? "border-cdl" : "border-border"
      )}
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
        
        {!isSelectionMode && (
          <div 
            {...dragHandleProps}
            className={cn(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              "w-8 h-8 rounded-full bg-background/80 border border-input flex items-center justify-center",
              "opacity-0 group-hover:opacity-100 transition-opacity cursor-grab",
              isDragging && "cursor-grabbing"
            )}
          >
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
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

import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { usePDFContext, PDFPage } from './PDFContext';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Grip, Maximize, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const PDFPageGrid: React.FC = () => {
  const { pages, togglePageSelection, reorderPages, selectPagesByArea } = usePDFContext();
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
    if (!gridRef.current) return;
    
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
    
    const onMouseUp = (upEvent: MouseEvent) => {
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
      
      // Only show selection options if we have selected pages
      if (selectedPageIds.length > 0) {
        const selectionOptionsElement = document.createElement('div');
        selectionOptionsElement.id = 'selection-options';
        selectionOptionsElement.style.position = 'absolute';
        selectionOptionsElement.style.left = `${selectionRect.right + 10}px`;
        selectionOptionsElement.style.top = `${selectionRect.top}px`;
        selectionOptionsElement.style.zIndex = '1000';
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add(
          'flex', 'items-center', 'gap-2', 'bg-background', 
          'p-2', 'rounded-md', 'shadow-md', 'border', 'border-input'
        );
        
        // Add the options UI to the DOM
        gridRef.current?.appendChild(selectionOptionsElement);
        selectionOptionsElement.appendChild(optionsContainer);
        
        // Render the selection options using React
        const SelectionOptions = () => {
          return (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  selectPagesByArea(selectedPageIds, true);
                  gridRef.current?.removeChild(selectionOptionsElement);
                }}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" /> Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  selectPagesByArea(selectedPageIds, false);
                  gridRef.current?.removeChild(selectionOptionsElement);
                }}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Deselect All
              </Button>
            </div>
          );
        };
        
        // Use ReactDOM to render the options
        const root = ReactDOM.createRoot(optionsContainer);
        root.render(<SelectionOptions />);
        
        // Add click handler to document to close options when clicking outside
        const closeHandler = (event: MouseEvent) => {
          if (
            selectionOptionsElement && 
            !selectionOptionsElement.contains(event.target as Node) &&
            gridRef.current?.contains(selectionOptionsElement)
          ) {
            gridRef.current?.removeChild(selectionOptionsElement);
            document.removeEventListener('click', closeHandler);
          }
        };
        
        // Delay adding the event listener to prevent immediate closure
        setTimeout(() => {
          document.addEventListener('click', closeHandler);
        }, 100);
      }
      
      setSelectionBox(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [selectionBox, selectPagesByArea]);
  
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
      className="relative cursor-crosshair"
      onMouseDown={handleMouseDown}
    >
      {selectionBox && (
        <div
          className="absolute bg-[#ec047b]/20 border border-[#ec047b] z-10 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.endY)
          }}
        />
      )}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable 
          droppableId="pdf-pages" 
          direction="horizontal"
          isDropDisabled={false}
        >
          {(provided) => (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-6 pb-6"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {pages.map((page, index) => (
                <Draggable 
                  key={page.id} 
                  draggableId={page.id} 
                  index={index}
                  disableInteractiveElementBlocking={true}
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
                        zIndex: snapshot.isDragging ? 1000 : 'auto',
                      }}
                      className={snapshot.isDragging ? "touch-none" : ""}
                    >
                      <PageCard
                        page={page}
                        index={index}
                        onCheckboxChange={handleCheckboxChange}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
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
}

const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  onCheckboxChange,
  dragHandleProps,
  isDragging
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border pdf-page",
        page.selected ? "border-cdl" : "border-border",
        isDragging ? "shadow-lg" : ""
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
        
        <Dialog>
          <DialogTrigger asChild>
            <button
              className={cn(
                "absolute bottom-2 right-2",
                "w-8 h-8 rounded-full bg-background/80 border border-input flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <Maximize className="h-4 w-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full p-1 bg-background">
            <div className="w-full max-h-[calc(100vh-120px)] overflow-auto">
              <img
                src={page.dataUrl}
                alt={`Page ${page.pageNumber} from ${page.file}`}
                className="w-full h-auto object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
        
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

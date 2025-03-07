
import React, { useState, useRef, useCallback } from 'react';
import { usePDFContext, PDFPage } from './PDFContext';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Grip, Maximize2, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PDFPageGrid: React.FC = () => {
  const { pages, togglePageSelection, reorderPages, selectPagesByArea } = usePDFContext();
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [selectedAreaPages, setSelectedAreaPages] = useState<string[]>([]);
  const [showSelectionActions, setShowSelectionActions] = useState(false);
  const [selectionActionPosition, setSelectionActionPosition] = useState({ x: 0, y: 0 });
  const [expandedPage, setExpandedPage] = useState<PDFPage | null>(null);
  
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

  const expandPage = (page: PDFPage) => {
    setExpandedPage(page);
  };

  const closeExpandedPage = () => {
    setExpandedPage(null);
  };
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    
    // Ignore if clicking on a card element (to allow normal interactions with cards)
    if ((e.target as HTMLElement).closest('.pdf-page')) {
      return;
    }
    
    // Hide selection actions if they're showing
    setShowSelectionActions(false);
    
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
      
      // Calculate which pages are in the current selection box
      const currentSelectionRect = {
        left: Math.min(startX, endX),
        right: Math.max(startX, endX),
        top: Math.min(startY, endY),
        bottom: Math.max(startY, endY)
      };
      
      // Highlight pages that intersect with the selection box
      const currentSelectedPageIds: string[] = [];
      pagesRef.current.forEach((rect, pageId) => {
        if (
          rect.left < currentSelectionRect.right &&
          rect.right > currentSelectionRect.left &&
          rect.top < currentSelectionRect.bottom &&
          rect.bottom > currentSelectionRect.top
        ) {
          currentSelectedPageIds.push(pageId);
        }
      });
      
      // Update the selected area pages in real-time
      setSelectedAreaPages(currentSelectedPageIds);
    };
    
    const onMouseUp = (upEvent: MouseEvent) => {
      if (!selectionBox) return;
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Only show action menu if we have selected pages
      if (selectedAreaPages.length > 0) {
        if (gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect();
          setSelectionActionPosition({
            x: upEvent.clientX - gridRect.left,
            y: upEvent.clientY - gridRect.top
          });
          setShowSelectionActions(true);
        }
      }
      
      // Clear the selection box
      setSelectionBox(null);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [selectionBox, selectedAreaPages]);

  const handleSelectAll = () => {
    selectPagesByArea(selectedAreaPages);
    setShowSelectionActions(false);
  };

  const handleDeselectAll = () => {
    // Deselect all pages in the selection area
    const pagesToToggle = pages
      .filter(page => selectedAreaPages.includes(page.id) && page.selected)
      .map(page => page.id);
    
    pagesToToggle.forEach(pageId => {
      togglePageSelection(pageId);
    });
    
    setShowSelectionActions(false);
  };
  
  // Update page references whenever pages change
  const setPageRef = useCallback((pageId: string, element: HTMLDivElement | null) => {
    if (element) {
      pagesRef.current.set(pageId, element.getBoundingClientRect());
    } else {
      pagesRef.current.delete(pageId);
    }
  }, []);
  
  // Update page references when component mounts or pages change
  React.useEffect(() => {
    const updatePageRefs = () => {
      const pageElements = document.querySelectorAll('.pdf-page');
      pageElements.forEach((element) => {
        const pageId = element.getAttribute('data-page-id');
        if (pageId) {
          pagesRef.current.set(pageId, element.getBoundingClientRect());
        }
      });
    };
    
    // Update refs after a small delay to ensure all pages are rendered
    const timer = setTimeout(updatePageRefs, 100);
    
    return () => clearTimeout(timer);
  }, [pages]);
  
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
          className="absolute bg-cdl/20 border border-cdl z-10 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY)
          }}
        />
      )}
      
      {/* Visual highlight for pages in current selection */}
      {selectedAreaPages.length > 0 && selectionBox && pages.map(page => (
        selectedAreaPages.includes(page.id) && (
          <div 
            key={`highlight-${page.id}`}
            className="absolute bg-cdl/10 border-2 border-cdl rounded-lg z-5 pointer-events-none"
            style={{
              left: pagesRef.current.get(page.id)?.left || 0,
              top: pagesRef.current.get(page.id)?.top || 0,
              width: pagesRef.current.get(page.id)?.width || 0,
              height: pagesRef.current.get(page.id)?.height || 0,
              transform: `translate(${gridRef.current ? -gridRef.current.scrollLeft : 0}px, ${gridRef.current ? -gridRef.current.scrollTop : 0}px)`
            }}
          />
        )
      ))}
      
      {showSelectionActions && (
        <div 
          className="absolute z-20 bg-background rounded-md shadow-lg p-2 flex gap-2"
          style={{
            left: selectionActionPosition.x,
            top: selectionActionPosition.y,
            transform: 'translate(-50%, 10px)'
          }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            className="flex items-center gap-1"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Select All</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeselectAll}
            className="flex items-center gap-1"
          >
            <Square className="h-4 w-4" />
            <span>Deselect All</span>
          </Button>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable 
          droppableId="pdf-pages" 
          direction="horizontal"
          renderClone={(provided, snapshot, rubric) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                width: '150px',  // Fixed width for dragged element
                height: '200px', // Fixed height for dragged element
                opacity: 0.7,    // Make it subtle/transparent
                zIndex: 1000     // Ensure it's above other elements
              }}
              className="bg-background rounded-md shadow-md"
            >
              <img
                src={pages[rubric.source.index].dataUrl}
                alt={`Page ${pages[rubric.source.index].pageNumber}`}
                className="w-full h-full object-contain p-2"
              />
            </div>
          )}
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
                        // Handle normal positioning when not dragging
                        transform: snapshot.isDragging ? provided.draggableProps.style?.transform : undefined,
                      }}
                      data-page-id={page.id}
                      className="pdf-page"
                    >
                      <PageCard
                        page={page}
                        index={index}
                        onCheckboxChange={handleCheckboxChange}
                        onExpand={expandPage}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={isDragging}
                        isHighlighted={selectedAreaPages.includes(page.id)}
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

      {/* Modal for expanded page view */}
      <Dialog open={expandedPage !== null} onOpenChange={closeExpandedPage}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] overflow-auto">
          {expandedPage && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl mb-4 font-medium">
                {expandedPage.file} - Page {expandedPage.pageNumber}
              </h2>
              <div className="border border-border rounded-md p-2 bg-white w-full">
                <img 
                  src={expandedPage.dataUrl} 
                  alt={`Page ${expandedPage.pageNumber} from ${expandedPage.file}`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PageCardProps {
  page: PDFPage;
  index: number;
  onCheckboxChange: (pageId: string) => void;
  onExpand: (page: PDFPage) => void;
  dragHandleProps: any;
  isDragging: boolean;
  isHighlighted?: boolean;
}

const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  onCheckboxChange,
  onExpand,
  dragHandleProps,
  isDragging,
  isHighlighted = false
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border pdf-page",
        page.selected ? "border-cdl" : "border-border",
        isHighlighted ? "ring-2 ring-cdl/70" : ""
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
        
        <div className="absolute top-2 right-2 flex space-x-2 group-hover:opacity-100 opacity-80 transition-opacity">
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
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-center">
            <p className="text-white text-xs font-medium truncate flex-1">
              {page.file} - Page {page.pageNumber}
            </p>
            <button 
              onClick={() => onExpand(page)}
              className="text-white hover:text-cdl transition-colors ml-2"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PDFPageGrid;

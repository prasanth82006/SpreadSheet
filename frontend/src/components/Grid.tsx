import React, { useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { evaluateFormula } from '../utils/formulaParser';

interface GridProps {
  activeCell: string | null;
  setActiveCell: (id: string | null) => void;
  docId: string;
}

const ROWS = 100;
const COLS = 26;

const getColLabel = (index: number) => String.fromCharCode(65 + index);

export default function Grid({ activeCell, setActiveCell, docId }: GridProps) {
  const { 
    cells, setCell, setIsSaving, formatting, 
    columnWidths, rowHeights, setColumnWidth, setRowHeight,
    columnOrder, rowOrder, setColumnOrder, setRowOrder
  } = useStore();
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize orders if empty
  const cols = useMemo(() => columnOrder.length === COLS ? columnOrder : Array.from({ length: COLS }, (_, i) => i), [columnOrder]);
  const rows = useMemo(() => rowOrder.length === ROWS ? rowOrder : Array.from({ length: ROWS }, (_, i) => i), [rowOrder]);

  const handleColumnReorder = (draggedIdx: number, targetIdx: number) => {
    if (draggedIdx === targetIdx) return;
    const newOrder = [...cols];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, removed);
    setColumnOrder(newOrder);
    socket.emit('column-reorder', { docId, order: newOrder });
  };

  const handleRowReorder = (draggedIdx: number, targetIdx: number) => {
    if (draggedIdx === targetIdx) return;
    const newOrder = [...rows];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, removed);
    setRowOrder(newOrder);
    socket.emit('row-reorder', { docId, order: newOrder });
  };

  const handleColumnResize = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[colIndex] || 96;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(40, startWidth + (moveEvent.pageX - startX));
      setColumnWidth(colIndex, newWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      const finalWidth = Math.max(40, startWidth + (upEvent.pageX - startX));
      socket.emit('column-resize', { docId, colIndex, width: finalWidth });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRowResize = (rowIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight = rowHeights[rowIndex] || 32;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = Math.max(20, startHeight + (moveEvent.pageY - startY));
      setRowHeight(rowIndex, newHeight);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      const finalHeight = Math.max(20, startHeight + (upEvent.pageY - startY));
      socket.emit('row-resize', { docId, rowIndex, height: finalHeight });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCellChange = (id: string, value: string) => {
    setIsSaving(true);
    setCell(id, value);
    socket.emit('cell-change', { docId, cellId: id, value });
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleNavigate = (currentRow: number, currentCol: number, e: React.KeyboardEvent) => {
    let nextRow = currentRow;
    let nextCol = currentCol;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      nextCol = Math.min(COLS - 1, currentCol + 1);
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      nextCol = Math.max(0, currentCol - 1);
    } else if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      nextRow = Math.min(ROWS - 1, currentRow + 1);
    } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      nextRow = Math.max(0, currentRow - 1);
    }

    if (nextRow !== currentRow || nextCol !== currentCol) {
      const nextId = `${getColLabel(nextCol)}${nextRow + 1}`;
      setActiveCell(nextId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <div 
        ref={gridRef}
        className="flex-1 overflow-auto border border-zinc-300"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        <div className="inline-block min-w-full">
          <div className="flex sticky top-0 z-20 bg-zinc-100 border-b border-zinc-300">
            <div className="w-12 min-w-[48px] sticky left-0 z-30 border-r border-zinc-300 bg-zinc-200"></div>
            {cols.map((colIdx, i) => (
              <div 
                key={colIdx} 
                draggable
                onDragStart={(e) => e.dataTransfer.setData('colIdx', i.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const draggedIdx = parseInt(e.dataTransfer.getData('colIdx'));
                  handleColumnReorder(draggedIdx, i);
                }}
                className="relative text-center text-zinc-600 font-medium py-1.5 border-r border-zinc-300 text-xs uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 cursor-grab active:cursor-grabbing transition-colors"
                style={{ width: columnWidths[colIdx] || 96, minWidth: columnWidths[colIdx] || 96 }}
              >
                {getColLabel(colIdx)}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-10"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleColumnResize(colIdx, e);
                  }}
                />
              </div>
            ))}
          </div>

          {rows.map((rowIdx, r) => (
            <div 
              key={rowIdx} 
              className="flex border-b border-zinc-200 group relative"
              style={{ height: rowHeights[rowIdx] || 32 }}
            >
              <div 
                draggable
                onDragStart={(e) => e.dataTransfer.setData('rowIdx', r.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const draggedIdx = parseInt(e.dataTransfer.getData('rowIdx'));
                  handleRowReorder(draggedIdx, r);
                }}
                className="w-12 min-w-[48px] sticky left-0 z-10 flex items-center justify-center bg-zinc-100 text-zinc-500 font-medium text-xs border-r border-zinc-300 group-hover:bg-zinc-200 cursor-grab active:cursor-grabbing transition-colors"
              >
                {rowIdx + 1}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 z-10"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleRowResize(rowIdx, e);
                  }}
                />
              </div>
              {cols.map((colIdx) => {
                const id = `${getColLabel(colIdx)}${rowIdx + 1}`;
                return (
                  <Cell
                    key={id}
                    value={cells[id] || ''}
                    cells={cells}
                    isActive={activeCell === id}
                    onSelect={() => setActiveCell(id)}
                    onChange={(val) => handleCellChange(id, val)}
                    onNavigate={(e) => handleNavigate(rowIdx, colIdx, e)}
                    format={formatting[id] || {}}
                    width={columnWidths[colIdx] || 96}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CellProps {
  value: string;
  cells: Record<string, string>;
  isActive: boolean;
  onSelect: () => void;
  onChange: (val: string) => void;
  onNavigate: (e: React.KeyboardEvent) => void;
  format: any;
  width: number;
}

const Cell = React.memo(({ value, cells, isActive, onSelect, onChange, onNavigate, format, width }: CellProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const computedValue = useMemo(() => {
    return evaluateFormula(value, cells);
  }, [value, cells]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isActive) {
      setIsEditing(false);
    } else {
      // Focus the cell div when selected to receive keyboard events
      if (!isEditing && cellRef.current) {
        cellRef.current.focus();
      }
    }
  }, [isActive, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        setIsEditing(false);
        // Move down after Enter in edit mode
        onNavigate(e);
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      } else if (e.key === 'Tab') {
        setIsEditing(false);
        onNavigate(e);
      }
      return;
    }

    if (isActive) {
      // Navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
        onNavigate(e);
        return;
      }

      // Typing to edit
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setIsEditing(true);
        onChange(e.key); // Replace current value with typed char
        return;
      }
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        onChange('');
        return;
      }
    }
  };

  return (
    <div
      ref={cellRef}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={`h-full border-r border-zinc-200 relative transition-all outline-none ${
        isActive ? 'ring-2 ring-blue-500 ring-inset z-10 shadow-lg bg-blue-50/10' : 'hover:bg-blue-50/30'
      }`}
      style={{
        width: width,
        minWidth: width,
        fontWeight: format.bold ? 'bold' : 'normal',
        fontStyle: format.italic ? 'italic' : 'normal',
        color: format.color || 'inherit',
        backgroundColor: format.bgColor || 'transparent',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full px-2 outline-none font-sans text-sm bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <div className="w-full h-full px-2 flex items-center overflow-hidden whitespace-nowrap text-ellipsis cursor-cell text-sm text-zinc-800">
          {computedValue}
        </div>
      )}
    </div>
  );
});

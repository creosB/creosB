import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ProjectPortfolio.css';

interface Cell {
  id: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  cells: Cell[];
}

interface SortableCellProps {
  id: string;
  content: string;
  onEdit: (id: string, content: string) => void;
  onRemove: (id: string) => void;
}

const SortableCell: React.FC<SortableCellProps> = ({ id, content, onEdit, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(content);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(id, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(content);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cell"
    >
      <div className="cell-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      {isEditing ? (
        <textarea
          className="cell-editor"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="cell-content" onDoubleClick={handleStartEdit}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              img: ({node, ...props}) => <img {...props} alt={props.alt || ''} loading="lazy" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
      <div className="cell-actions">
        <button
          className="edit-cell-btn"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleStartEdit();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          title="Edit (Double-click cell or press this)"
        >
          ✏️
        </button>
        <button
          className="remove-cell-btn"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface SortableColumnProps {
  column: Column;
  onEditTitle: (id: string, title: string) => void;
  onEditCell: (columnId: string, cellId: string, content: string) => void;
  onRemoveCell: (columnId: string, cellId: string) => void;
  onAddCell: (columnId: string) => void;
  onAddColumn: (afterColumnId: string) => void;
  onRemoveColumn: (id: string) => void;
  isLastColumn: boolean;
}

const SortableColumn: React.FC<SortableColumnProps> = ({
  column,
  onEditTitle,
  onEditCell,
  onRemoveCell,
  onAddCell,
  onAddColumn,
  onRemoveColumn,
  isLastColumn,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    onEditTitle(column.id, titleValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleValue(column.title);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="column">
      <div className="column-header">
        <div className="column-drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </div>
        {isEditingTitle ? (
          <input
            type="text"
            className="column-title-editor"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="column-title"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
              setTitleValue(column.title);
            }}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <span {...props} />,
                img: ({node, ...props}) => <img {...props} alt={props.alt || ''} loading="lazy" />,
              }}
            >
              {column.title}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div className="column-actions">
        <button
          className="add-column-btn"
          onClick={() => onAddColumn(column.id)}
          title="Add column after this"
        >
          +
        </button>
        {!isLastColumn && (
          <button
            className="remove-column-btn"
            onClick={() => onRemoveColumn(column.id)}
            title="Remove column"
          >
            -
          </button>
        )}
      </div>
      <div className="cells-container">
        <SortableContext
          items={column.cells.map((cell) => cell.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cells.map((cell) => (
            <SortableCell
              key={cell.id}
              id={cell.id}
              content={cell.content}
              onEdit={(cellId, content) => onEditCell(column.id, cellId, content)}
              onRemove={(cellId) => onRemoveCell(column.id, cellId)}
            />
          ))}
        </SortableContext>
      </div>
      <button className="add-cell-btn" onClick={() => onAddCell(column.id)}>
        + Add Project
      </button>
    </div>
  );
};

const ProjectPortfolio: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('project-portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
    // Default columns
    return [
      {
        id: 'column-1',
        title: 'To Do',
        cells: [
          { id: 'cell-1', content: 'Project Alpha' },
          { id: 'cell-2', content: 'Project Beta' },
        ],
      },
      {
        id: 'column-2',
        title: 'In Progress',
        cells: [
          { id: 'cell-3', content: 'Project Gamma' },
        ],
      },
      {
        id: 'column-3',
        title: 'Done',
        cells: [
          { id: 'cell-4', content: 'Project Delta' },
          { id: 'cell-5', content: 'Project Epsilon' },
        ],
      },
    ];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'column' | 'cell' | null>(null);

  // Save to localStorage whenever columns change
  React.useEffect(() => {
    localStorage.setItem('project-portfolio', JSON.stringify(columns));
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determine if dragging a column or cell
    const isColumn = columns.some((col) => col.id === active.id);
    setActiveType(isColumn ? 'column' : 'cell');
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column contains the active cell
    const activeColumn = columns.find((col) =>
      col.cells.some((cell) => cell.id === activeId)
    );
    
    // Find which column contains the over cell
    const overColumn = columns.find((col) =>
      col.cells.some((cell) => cell.id === overId)
    );

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return;

    // Move cell between columns
    setColumns((prevColumns) => {
      const activeItems = activeColumn.cells;
      const overItems = overColumn.cells;

      const activeIndex = activeItems.findIndex((cell) => cell.id === activeId);
      const overIndex = overItems.findIndex((cell) => cell.id === overId);

      const activeCell = activeItems[activeIndex];

      return prevColumns.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            cells: col.cells.filter((cell) => cell.id !== activeId),
          };
        }
        if (col.id === overColumn.id) {
          const newCells = [...col.cells];
          newCells.splice(overIndex, 0, activeCell);
          return {
            ...col,
            cells: newCells,
          };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if we're dragging columns
    const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
    const overColumnIndex = columns.findIndex((col) => col.id === overId);

    if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
      // Reorder columns
      setColumns((prevColumns) => arrayMove(prevColumns, activeColumnIndex, overColumnIndex));
      return;
    }

    // Check if we're dragging cells within the same column
    const column = columns.find((col) =>
      col.cells.some((cell) => cell.id === activeId || cell.id === overId)
    );

    if (column) {
      const activeIndex = column.cells.findIndex((cell) => cell.id === activeId);
      const overIndex = column.cells.findIndex((cell) => cell.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        setColumns((prevColumns) =>
          prevColumns.map((col) => {
            if (col.id === column.id) {
              return {
                ...col,
                cells: arrayMove(col.cells, activeIndex, overIndex),
              };
            }
            return col;
          })
        );
      }
    }
  };

  const handleEditColumnTitle = (columnId: string, newTitle: string) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    );
  };

  const handleEditCell = (columnId: string, cellId: string, newContent: string) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cells: col.cells.map((cell) =>
              cell.id === cellId ? { ...cell, content: newContent } : cell
            ),
          };
        }
        return col;
      })
    );
  };

  const handleRemoveCell = (columnId: string, cellId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              cells: col.cells.filter((cell) => cell.id !== cellId),
            };
          }
          return col;
        })
      );
    }
  };

  const handleAddCell = (columnId: string) => {
    const newCell: Cell = {
      id: `cell-${Date.now()}`,
      content: 'New Project',
    };

    setColumns((prevColumns) =>
      prevColumns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cells: [...col.cells, newCell],
          };
        }
        return col;
      })
    );
  };

  const handleAddColumn = (afterColumnId: string) => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: 'New Category',
      cells: [],
    };

    setColumns((prevColumns) => {
      const index = prevColumns.findIndex((col) => col.id === afterColumnId);
      const newColumns = [...prevColumns];
      newColumns.splice(index + 1, 0, newColumn);
      return newColumns;
    });
  };

  const handleRemoveColumn = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.cells.length > 0) {
      if (!window.confirm(`Delete "${column.title}" column and all ${column.cells.length} projects in it?`)) {
        return;
      }
    }
    setColumns((prevColumns) => prevColumns.filter((col) => col.id !== columnId));
  };

  const handleExportToMarkdown = () => {
    let markdown = '# Project Portfolio\n\n';
    markdown += '<h3 align="center">My Projects</h3>\n';
    markdown += '<hr style="height:30pt; visibility:hidden;" />\n\n';

    // Create table header
    markdown += '| ' + columns.map(col => col.title).join(' | ') + ' |\n';
    markdown += '|' + columns.map(() => '-'.repeat(50)).join('|') + '|\n';

    // Find the maximum number of cells in any column
    const maxCells = Math.max(...columns.map(col => col.cells.length), 1);

    // Create table rows
    for (let i = 0; i < maxCells; i++) {
      markdown += '| ';
      const row = columns.map(col => {
        if (i < col.cells.length) {
          return col.cells[i].content;
        }
        return '';
      });
      markdown += row.join(' | ');
      markdown += ' |\n';
    }

    markdown += '\n';

    // Create a blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-portfolio.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadExample = () => {
    const exampleColumns: Column[] = [
      {
        id: 'column-1',
        title: '![Game](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/dev/misc/gamedev.svg)',
        cells: [
          { id: 'cell-1', content: '[World Guesser](https://store.steampowered.com/app/2402620/World_Guesser/) (Unreal Engine)' },
          { id: 'cell-2', content: '[HandSaber](https://github.com/creosB/handsaber) (Unreal Engine)' },
          { id: 'cell-3', content: '[OburRun](https://github.com/creosB/OburRun) (Unreal Engine)' },
          { id: 'cell-4', content: '[NFT Art Gallery](https://github.com/creosB/NFT-Art-Gallery) (Unreal Engine)' },
          { id: 'cell-5', content: '[Dragon Castle](https://play.google.com/store/apps/details?id=com.artistscompany.dragoncastle) (Unreal Engine)' },
        ],
      },
      {
        id: 'column-2',
        title: '![Mobile](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/dev/misc/mobile.svg)',
        cells: [
          { id: 'cell-6', content: '[My Advice](https://play.google.com/store/apps/details?id=com.artistscompany.myadvice) (flutter)' },
          { id: 'cell-7', content: '[Coartist](https://play.google.com/store/apps/details?id=com.artistscompany.coartist) (flutter)' },
          { id: 'cell-8', content: '[Story Land](https://play.google.com/store/apps/details?id=com.artistscompany.story_land) (flutter)' },
        ],
      },
      {
        id: 'column-3',
        title: '![Desktop](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/dev/misc/desktop.svg)',
        cells: [
          { id: 'cell-9', content: '[Virtual PDF Library](https://github.com/creosB/Virtual-pdf-library) (flutter)' },
          { id: 'cell-10', content: '[Free Game Track](https://github.com/creosB/FreeGameTrack) (flutter)' },
        ],
      },
      {
        id: 'column-4',
        title: '![Website](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/dev/misc/web.svg)',
        cells: [
          { id: 'cell-11', content: '[Artists Company](https://artistscompany.net/) (Astro)' },
          { id: 'cell-12', content: '[Coartist](https://coartist.net) (Nextjs)' },
        ],
      },
      {
        id: 'column-5',
        title: '![Tools](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/dev/misc/tools.svg)',
        cells: [
          { id: 'cell-13', content: '[Prompt Flow Chrome/Edge Extension](https://chromewebstore.google.com/detail/prompt-flow/dccdogklejddekpeccaelmamopaincni)' },
          { id: 'cell-14', content: '[AI Side Panel Chrome/Edge Extension](https://github.com/creosB/AI-Side-Panel-Extension)' },
        ],
      },
      {
        id: 'column-6',
        title: '![Blogs](https://raw.githubusercontent.com/MikeCodesDotNET/ColoredBadges/master/svg/blogs/devto.svg)',
        cells: [
          { id: 'cell-15', content: '[Unreal Engine Scripts and Notes](https://github.com/creosB/UnrealScriptsandNotes)' },
          { id: 'cell-16', content: '[H1EUMU Website Translation](https://github.com/creosB/h1emu_langs)' },
        ],
      },
    ];
    setColumns(exampleColumns);
  };

  const handleImportMarkdown = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          parseMarkdownToColumns(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const parseMarkdownToColumns = (markdown: string) => {
    // Split by lines
    const lines = markdown.split('\n');
    
    // Find the table (look for lines with pipes)
    const tableStart = lines.findIndex(line => line.trim().startsWith('|') && !line.includes('---'));
    if (tableStart === -1) return;

    // Get header row
    const headerLine = lines[tableStart];
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter(h => h !== '');

    // Skip the separator line (with dashes)
    const dataStartIndex = tableStart + 2;
    
    // Parse data rows
    const newColumns: Column[] = headers.map((header, colIndex) => ({
      id: `column-${Date.now()}-${colIndex}`,
      title: header,
      cells: [],
    }));

    // Process each data row
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) break;
      
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter((_c, idx) => idx > 0 && idx <= headers.length); // Skip first empty and extras

      cells.forEach((cellContent, colIndex) => {
        if (cellContent && colIndex < newColumns.length) {
          newColumns[colIndex].cells.push({
            id: `cell-${Date.now()}-${colIndex}-${newColumns[colIndex].cells.length}`,
            content: cellContent,
          });
        }
      });
    }

    setColumns(newColumns);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setColumns([
        {
          id: `column-${Date.now()}`,
          title: 'New Category',
          cells: [],
        },
      ]);
      localStorage.removeItem('project-portfolio');
    }
  };

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">Project Portfolio</div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="table-container">
          <div className="columns-container">
            <SortableContext
              items={columns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  onEditTitle={handleEditColumnTitle}
                  onEditCell={handleEditCell}
                  onRemoveCell={handleRemoveCell}
                  onAddCell={handleAddCell}
                  onAddColumn={handleAddColumn}
                  onRemoveColumn={handleRemoveColumn}
                  isLastColumn={columns.length === 1}
                />
              ))}
            </SortableContext>
          </div>
        </div>
        <DragOverlay>
          {activeId && activeType === 'column' ? (
            <div className="column drag-overlay">
              <div className="column-header">
                {columns.find((col) => col.id === activeId)?.title}
              </div>
            </div>
          ) : activeId && activeType === 'cell' ? (
            <div className="cell drag-overlay">
              {columns
                .flatMap((col) => col.cells)
                .find((cell) => cell.id === activeId)?.content}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <div className="action-buttons">
        <button className="example-btn" onClick={handleLoadExample} title="Load example portfolio with sample data">
          📋 Load Example
        </button>
        <button className="import-btn" onClick={handleImportMarkdown} title="Import markdown table from file">
          📥 Import Markdown
        </button>
        <button className="export-btn" onClick={handleExportToMarkdown} title="Export portfolio as markdown table">
          📤 Export to Markdown
        </button>
        <button className="clear-btn" onClick={handleClearAll} title="Clear all data and start fresh">
          🗑️ Clear All
        </button>
      </div>
      <div className="help-text">
        <p><strong>💡 Tips:</strong></p>
        <ul>
          <li>Double-click to edit column headers or project cells</li>
          <li>Drag columns by their headers to reorder</li>
          <li>Drag projects to move them within or between columns</li>
          <li>Use markdown formatting: [text](url) for links, ![alt](url) for images</li>
          <li>Press Ctrl+Enter in text editor to save, Escape to cancel</li>
          <li>Data is automatically saved to your browser</li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectPortfolio;

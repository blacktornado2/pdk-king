import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePageCardProps {
  id: string;
  thumbnail: string;
  pageLabel: number;
}

export function SortablePageCard({ id, thumbnail, pageLabel }: SortablePageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing hover:border-[var(--accent)] transition-colors"
      {...attributes}
      {...listeners}
    >
      <img src={thumbnail} alt={`Page ${pageLabel}`} className="w-full object-contain pointer-events-none" draggable={false} />
      <div className="absolute bottom-0 inset-x-0 bg-[var(--bg-95)] py-1 text-center">
        <span className="font-mono text-[11px] text-[var(--text-2)]">{pageLabel}</span>
      </div>
    </div>
  );
}

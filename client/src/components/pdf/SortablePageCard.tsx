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
      className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-sm transition-all"
      {...attributes}
      {...listeners}
    >
      <img
        src={thumbnail}
        alt={`Page ${pageLabel}`}
        className="w-full object-contain pointer-events-none"
        draggable={false}
      />
      <div className="absolute bottom-0 inset-x-0 bg-white/90 py-1 text-center">
        <span className="text-xs font-medium text-gray-500">{pageLabel}</span>
      </div>
    </div>
  );
}

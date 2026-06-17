import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';

interface ToolCardProps {
  to: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  index?: number;
}

export function ToolCard({ to, title, description, Icon, index = 0 }: ToolCardProps) {
  const { glow } = useTheme();
  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, boxShadow: `0 0 28px ${glow.r45}`, zIndex: 10 }}
    >
      <Link
        to={to}
        className="group flex flex-col gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6"
        style={{ borderLeft: '3px solid var(--accent)' }}
      >
        <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg w-fit">
          <Icon className="w-6 h-6 text-[var(--accent)]" aria-hidden />
        </div>
        <h3 className="font-syne font-bold text-xl text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-2)] leading-relaxed">{description}</p>
      </Link>
    </motion.div>
  );
}

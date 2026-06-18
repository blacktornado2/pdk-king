import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/useTheme';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  index?: number;
}

export function Card({ children, className = '', hover = false, index = 0 }: CardProps) {
  const { glow } = useTheme();
  return (
    <motion.div
      className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 ${className}`}
      style={{ borderLeft: '3px solid var(--accent)' }}
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={hover ? { scale: 1.03, boxShadow: `0 0 28px ${glow.r45}`, zIndex: 10 } : undefined}
    >
      {children}
    </motion.div>
  );
}

import axios from 'axios';
import type { Job } from '../types';

// In dev, defaults to the relative path proxied by Vite (see vite.config.ts).
// In prod, set VITE_API_URL to the deployed API base (e.g. https://api.example.com/api/v1).
const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const http = axios.create({ baseURL: API_BASE });

export type SplitMode = 'EXTRACT' | 'RANGES' | 'EVERY_N';

export const pdfApi = {
  merge: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return http.post<{ jobId: string }>('/pdf/merge', form);
  },

  compress: (file: File, quality: 'low' | 'medium' | 'high') => {
    const form = new FormData();
    form.append('file', file);
    form.append('quality', quality);
    return http.post<{ jobId: string }>('/pdf/compress', form);
  },

  reorder: (file: File, order: number[]) => {
    const form = new FormData();
    form.append('file', file);
    form.append('order', JSON.stringify(order));
    return http.post<{ jobId: string }>('/pdf/reorder', form);
  },

  split: (file: File, opts: { mode: SplitMode; pages?: string; ranges?: string; n?: number }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('mode', opts.mode);
    if (opts.pages) form.append('pages', opts.pages);
    if (opts.ranges) form.append('ranges', opts.ranges);
    if (opts.n != null) form.append('n', String(opts.n));
    return http.post<{ jobId: string }>('/pdf/split', form);
  },

  unlock: (file: File, password: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    return http.post<{ jobId: string }>('/pdf/unlock', form);
  },

  protect: (file: File, password: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    return http.post<{ jobId: string }>('/pdf/protect', form);
  },

  rotate: (file: File, pages: string, degrees: 90 | 180 | 270) => {
    const form = new FormData();
    form.append('file', file);
    form.append('pages', pages);
    form.append('degrees', String(degrees));
    return http.post<{ jobId: string }>('/pdf/rotate', form);
  },

  extract: (file: File, pages: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('pages', pages);
    return http.post<{ jobId: string }>('/pdf/extract', form);
  },

  watermark: (file: File, text: string, opacity: number, fontSize: number) => {
    const form = new FormData();
    form.append('file', file);
    form.append('text', text);
    form.append('opacity', String(opacity));
    form.append('fontSize', String(fontSize));
    return http.post<{ jobId: string }>('/pdf/watermark', form);
  },

  editPdf: (file: File, edits: object[]) => {
    const form = new FormData();
    form.append('file', file);
    form.append('edits', JSON.stringify(edits));
    return http.post<{ jobId: string }>('/pdf/edit', form);
  },

  addPageNumbers: (file: File, position: string, startFrom: number, fontSize: number) => {
    const form = new FormData();
    form.append('file', file);
    form.append('position', position);
    form.append('startFrom', String(startFrom));
    form.append('fontSize', String(fontSize));
    return http.post<{ jobId: string }>('/pdf/page-numbers', form);
  },

  editMetadata: (file: File, fields: { title?: string; author?: string; subject?: string; keywords?: string }) => {
    const form = new FormData();
    form.append('file', file);
    if (fields.title    !== undefined) form.append('title',    fields.title);
    if (fields.author   !== undefined) form.append('author',   fields.author);
    if (fields.subject  !== undefined) form.append('subject',  fields.subject);
    if (fields.keywords !== undefined) form.append('keywords', fields.keywords);
    return http.post<{ jobId: string }>('/pdf/metadata', form);
  },

  toImages: (file: File, format: 'jpeg' | 'png') => {
    const form = new FormData();
    form.append('file', file);
    form.append('format', format);
    return http.post<{ jobId: string }>('/pdf/to-images', form);
  },
};

export const jobsApi = {
  status: (id: string) => http.get<Job>(`/jobs/${id}`),
  downloadUrl: (id: string) => `${API_BASE}/jobs/${id}/download`,
  delete: (id: string) => http.delete(`/jobs/${id}`),
};

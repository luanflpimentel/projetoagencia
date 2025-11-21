import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: string | null): string {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string | null): string {
  if (!data) return '-';
  return new Date(data).toLocaleString('pt-BR');
}
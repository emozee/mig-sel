import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NavigateFunction } from 'react-router';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const goBackSafe = (navigate: NavigateFunction, fallback = '/map') => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(fallback, { replace: true });
  }
};

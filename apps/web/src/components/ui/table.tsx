import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Tabla de datos, sobre elementos nativos.
 *
 * No hay primitiva de Base UI para esto ni hace falta: `<table>` ya trae la
 * navegación por celdas de los lectores de pantalla, y cualquier reimplementación
 * con `<div role="table">` la pierde a cambio de nada.
 *
 * Se usa cuando el usuario **escanea para administrar** y hay más de ~15 filas
 * (profesores pendientes, inscritos de una clase). Para escanear y elegir, la
 * pieza correcta es la tarjeta dentro de `<RejillaAulas>`.
 *
 * El envoltorio con `overflow-x-auto` es obligatorio: sin él, una tabla ancha
 * empuja el `<body>` y rompe el zoom al 200%.
 */
export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className={cn('w-full caption-top border-collapse text-base', className)} {...props} />
    </div>
  );
}

/**
 * Título de la tabla. **Ponlo siempre**: es el nombre accesible de la tabla, lo
 * que un lector de pantalla anuncia al entrar. Si estorba visualmente, `sr-only`;
 * lo que no vale es omitirlo.
 */
export function TableCaption({ className, ...props }: ComponentPropsWithoutRef<'caption'>) {
  return (
    <caption
      className={cn('px-4 py-3 text-left text-base text-muted-foreground', className)}
      {...props}
    />
  );
}

export function TableHeader({ className, ...props }: ComponentPropsWithoutRef<'thead'>) {
  return <thead className={cn('border-b border-border bg-muted/40', className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentPropsWithoutRef<'tbody'>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: ComponentPropsWithoutRef<'tr'>) {
  return <tr className={cn('border-b border-border last:border-b-0', className)} {...props} />;
}

/**
 * Celda de encabezado. `scope` viene puesto: sin él, un lector de pantalla no
 * puede decir a qué columna pertenece la celda que está leyendo.
 */
export function TableHead({ className, scope = 'col', ...props }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      scope={scope}
      className={cn('px-4 py-3 text-left text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentPropsWithoutRef<'td'>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}

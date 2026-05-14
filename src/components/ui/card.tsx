import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
<<<<<<< HEAD
        'group/card bg-card text-card-foreground flex flex-col gap-8 overflow-hidden rounded-lg p-6 text-sm shadow-card has-[>img:first-child]:pt-0 data-[size=sm]:gap-5 data-[size=sm]:p-5 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg',
=======
        'group/card bg-card text-card-foreground ring-foreground/5 flex flex-col gap-8 overflow-hidden py-8 text-sm shadow-sm ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-5 data-[size=sm]:py-5 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none',
>>>>>>> 342c3319d0358be55605e268909edf52907a854b
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
<<<<<<< HEAD
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
=======
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-none px-8 group-data-[size=sm]/card:px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-8 group-data-[size=sm]/card:[.border-b]:pb-5',
>>>>>>> 342c3319d0358be55605e268909edf52907a854b
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
<<<<<<< HEAD
      className={cn('text-xl font-semibold tracking-tight', className)}
=======
      className={cn('font-heading text-lg font-semibold tracking-wider uppercase', className)}
>>>>>>> 342c3319d0358be55605e268909edf52907a854b
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm leading-relaxed', className)}
      {...props}
    />
  );
}

<<<<<<< HEAD
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

=======
>>>>>>> 342c3319d0358be55605e268909edf52907a854b
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

<<<<<<< HEAD
export { Card, CardHeader, CardTitle, CardAction, CardDescription, CardContent, CardFooter };
=======
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-8 group-data-[size=sm]/card:px-5', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center px-8 group-data-[size=sm]/card:px-5 [.border-t]:pt-8 group-data-[size=sm]/card:[.border-t]:pt-5',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
>>>>>>> 342c3319d0358be55605e268909edf52907a854b

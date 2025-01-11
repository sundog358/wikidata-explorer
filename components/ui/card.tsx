<<<<<<< HEAD
import * as React from "react";

import { cn } from "@/docs/utils";
=======
import * as React from 'react';

import { cn } from '@/lib/utils';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "rounded-lg border bg-card text-card-foreground shadow-sm",
=======
      'rounded-lg border bg-card text-card-foreground shadow-sm',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      className
    )}
    {...props}
  />
));
<<<<<<< HEAD
Card.displayName = "Card";
=======
Card.displayName = 'Card';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
<<<<<<< HEAD
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";
=======
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "text-2xl font-semibold leading-none tracking-tight",
=======
      'text-2xl font-semibold leading-none tracking-tight',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      className
    )}
    {...props}
  />
));
<<<<<<< HEAD
CardTitle.displayName = "CardTitle";
=======
CardTitle.displayName = 'CardTitle';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
<<<<<<< HEAD
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";
=======
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
<<<<<<< HEAD
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
=======
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
<<<<<<< HEAD
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
=======
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

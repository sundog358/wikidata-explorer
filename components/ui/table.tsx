<<<<<<< HEAD
import * as React from "react";

import { cn } from "@/docs/utils";
=======
import * as React from 'react';

import { cn } from '@/lib/utils';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
<<<<<<< HEAD
      className={cn("w-full caption-bottom text-sm", className)}
=======
      className={cn('w-full caption-bottom text-sm', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      {...props}
    />
  </div>
));
<<<<<<< HEAD
Table.displayName = "Table";
=======
Table.displayName = 'Table';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
<<<<<<< HEAD
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";
=======
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
<<<<<<< HEAD
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";
=======
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
=======
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      className
    )}
    {...props}
  />
));
<<<<<<< HEAD
TableFooter.displayName = "TableFooter";
=======
TableFooter.displayName = 'TableFooter';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
=======
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      className
    )}
    {...props}
  />
));
<<<<<<< HEAD
TableRow.displayName = "TableRow";
=======
TableRow.displayName = 'TableRow';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
=======
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      className
    )}
    {...props}
  />
));
<<<<<<< HEAD
TableHead.displayName = "TableHead";
=======
TableHead.displayName = 'TableHead';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
<<<<<<< HEAD
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";
=======
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
<<<<<<< HEAD
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
=======
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

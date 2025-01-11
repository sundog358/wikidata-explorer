<<<<<<< HEAD
import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/docs/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;
=======
import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ButtonProps, buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const PaginationLink = ({
  className,
  isActive,
<<<<<<< HEAD
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
=======
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
        size,
      }),
      className
    )}
    {...props}
  />
);
<<<<<<< HEAD
PaginationLink.displayName = "PaginationLink";
=======
PaginationLink.displayName = 'PaginationLink';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
<<<<<<< HEAD
    className={cn("gap-1 pl-2.5", className)}
=======
    className={cn('gap-1 pl-2.5', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
<<<<<<< HEAD
PaginationPrevious.displayName = "PaginationPrevious";
=======
PaginationPrevious.displayName = 'PaginationPrevious';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
<<<<<<< HEAD
    className={cn("gap-1 pr-2.5", className)}
=======
    className={cn('gap-1 pr-2.5', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
<<<<<<< HEAD
PaginationNext.displayName = "PaginationNext";
=======
PaginationNext.displayName = 'PaginationNext';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const PaginationEllipsis = ({
  className,
  ...props
<<<<<<< HEAD
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
=======
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
<<<<<<< HEAD
PaginationEllipsis.displayName = "PaginationEllipsis";
=======
PaginationEllipsis.displayName = 'PaginationEllipsis';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

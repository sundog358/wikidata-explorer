<<<<<<< HEAD
import * as React from "react";

import { cn } from "@/docs/utils";
=======
import * as React from 'react';

import { cn } from '@/lib/utils';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
<<<<<<< HEAD
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
=======
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
<<<<<<< HEAD
Textarea.displayName = "Textarea";
=======
Textarea.displayName = 'Textarea';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export { Textarea };

<<<<<<< HEAD
import { cn } from "@/docs/utils";
=======
import { cn } from '@/lib/utils';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
<<<<<<< HEAD
      className={cn("animate-pulse rounded-md bg-muted", className)}
=======
      className={cn('animate-pulse rounded-md bg-muted', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      {...props}
    />
  );
}

export { Skeleton };

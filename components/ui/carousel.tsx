<<<<<<< HEAD
"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/docs/utils";
import { Button } from "@/components/ui/button";
=======
'use client';

import * as React from 'react';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
<<<<<<< HEAD
  orientation?: "horizontal" | "vertical";
=======
  orientation?: 'horizontal' | 'vertical';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
<<<<<<< HEAD
    throw new Error("useCarousel must be used within a <Carousel />");
=======
    throw new Error('useCarousel must be used within a <Carousel />');
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
<<<<<<< HEAD
      orientation = "horizontal",
=======
      orientation = 'horizontal',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
<<<<<<< HEAD
        axis: orientation === "horizontal" ? "x" : "y",
=======
        axis: orientation === 'horizontal' ? 'x' : 'y',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      },
      plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
<<<<<<< HEAD
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
=======
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
<<<<<<< HEAD
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
=======
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api?.off('select', onSelect);
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
<<<<<<< HEAD
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
=======
            orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
<<<<<<< HEAD
          className={cn("relative", className)}
=======
          className={cn('relative', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
<<<<<<< HEAD
Carousel.displayName = "Carousel";
=======
Carousel.displayName = 'Carousel';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
<<<<<<< HEAD
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
=======
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
          className
        )}
        {...props}
      />
    </div>
  );
});
<<<<<<< HEAD
CarouselContent.displayName = "CarouselContent";
=======
CarouselContent.displayName = 'CarouselContent';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
<<<<<<< HEAD
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
=======
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
        className
      )}
      {...props}
    />
  );
});
<<<<<<< HEAD
CarouselItem.displayName = "CarouselItem";
=======
CarouselItem.displayName = 'CarouselItem';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
<<<<<<< HEAD
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
=======
>(({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
<<<<<<< HEAD
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
=======
        'absolute  h-8 w-8 rounded-full',
        orientation === 'horizontal'
          ? '-left-12 top-1/2 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
<<<<<<< HEAD
CarouselPrevious.displayName = "CarouselPrevious";
=======
CarouselPrevious.displayName = 'CarouselPrevious';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
<<<<<<< HEAD
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
=======
>(({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
<<<<<<< HEAD
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
=======
        'absolute h-8 w-8 rounded-full',
        orientation === 'horizontal'
          ? '-right-12 top-1/2 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
<<<<<<< HEAD
CarouselNext.displayName = "CarouselNext";
=======
CarouselNext.displayName = 'CarouselNext';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};

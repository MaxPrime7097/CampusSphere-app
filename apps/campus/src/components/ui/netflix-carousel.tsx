import React, { useRef, useState, useEffect } from 'react';
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from "@phosphor-icons/react";
import { cn } from '@/lib/utils';

export function NetflixCarousel({ children, className }: { children: React.ReactNode, className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/carousel w-full">
      {/* Flèche Gauche (PC Uniquement) */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12 z-20 hidden md:flex items-center justify-start pl-1 opacity-0 transition-opacity duration-300 pointer-events-none",
          showLeft && "group-hover/carousel:opacity-100 pointer-events-auto"
        )}
      >
        <button 
          onClick={() => scrollBy('left')}
          className="h-10 w-10 rounded-full bg-background/90 shadow-md border flex items-center justify-center hover:scale-110 hover:bg-background text-foreground transition-all cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      <div 
        ref={scrollRef} 
        onScroll={checkScroll} 
        className={cn("cs-scroll-row scroll-smooth pb-2 pt-1", className)}
      >
        {children}
      </div>

      {/* Flèche Droite (PC Uniquement) */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-12 z-20 hidden md:flex items-center justify-end pr-1 opacity-0 transition-opacity duration-300 pointer-events-none",
          showRight && "group-hover/carousel:opacity-100 pointer-events-auto"
        )}
      >
        <button 
          onClick={() => scrollBy('right')}
          className="h-10 w-10 rounded-full bg-background/90 shadow-md border flex items-center justify-center hover:scale-110 hover:bg-background text-foreground transition-all cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

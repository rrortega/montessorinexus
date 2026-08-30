import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicBlogCategoryItem } from '@/pages/public/BlogIndexPage';
import { Button } from '@/components/ui/button';

interface CategoryScrollNavProps {
  categories: PublicBlogCategoryItem[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  isSaaSBlog: boolean;
}

export const CategoryScrollNav: React.FC<CategoryScrollNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isSaaSBlog
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollability();

    const handleScroll = () => checkScrollability();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = Math.max(el.clientWidth * 0.65, 260);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative w-full group/nav select-none py-1">
      {/* Left Handler / Arrow */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-4 bg-gradient-to-r from-background via-background/90 to-transparent">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="w-8 h-8 p-0 rounded-full bg-white/95 dark:bg-card/95 border-border shadow-md hover:bg-muted text-stone-700 dark:text-stone-200 hover:border-[#C4661F]/40 transition-all cursor-pointer"
            title="Ver categorías anteriores"
            aria-label="Ver categorías anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Categories Scrollable Container (No visible scrollbars) */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? (isSaaSBlog ? 'bg-[#C4661F] text-white shadow-xs' : 'bg-forest text-white shadow-xs')
              : 'bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          Todos los temas
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? (isSaaSBlog ? 'bg-[#C4661F] text-white shadow-xs' : 'bg-forest text-white shadow-xs')
                  : 'bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              {cat.name} {cat.postCount > 0 && <span className="opacity-75 text-[11px] font-normal ml-0.5">({cat.postCount})</span>}
            </button>
          );
        })}
      </div>

      {/* Right Handler / Arrow */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-4 bg-gradient-to-l from-background via-background/90 to-transparent">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="w-8 h-8 p-0 rounded-full bg-white/95 dark:bg-card/95 border-border shadow-md hover:bg-muted text-stone-700 dark:text-stone-200 hover:border-[#C4661F]/40 transition-all cursor-pointer"
            title="Ver más categorías"
            aria-label="Ver más categorías"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryScrollNav;

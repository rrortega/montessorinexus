import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Settings, Hand, Trees, Palette, LucideIcon, X } from 'lucide-react';
import Stories from 'react-insta-stories';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { Magnetic } from './ui/magnetic';
import galleryData from '@/data/gallery.json';
import { getGalleryCategories, getGalleryImages, GalleryCategory, GalleryImageItem } from '@/lib/sqlite';

interface Category {
  id: string;
  label: string;
  label_en: string;
  icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  all: LayoutGrid,
  practical: Settings,
  sensory: Hand,
  outdoors: Trees,
  arts: Palette,
};

export function GallerySection() {
  const { t, locale } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dbImages, setDbImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const showSection = import.meta.env.VITE_SHOW_GALLERY_SECTION === 'true';

  useEffect(() => {
    if (!showSection) return;

    async function fetchGalleryData() {
      try {
        const catRes = await getGalleryCategories();
        const imgRes = await getGalleryImages();

        if (catRes && catRes.length > 0) {
          const formattedCats: Category[] = [
            { id: 'all', label: 'Todos los Momentos', label_en: 'All Moments', icon: LayoutGrid },
            ...catRes.map(c => ({
              id: c.id,
              label: c.label,
              label_en: c.label_en || c.label,
              icon: ICON_MAP[c.id] || LayoutGrid,
            }))
          ];
          setCategories(formattedCats);
        } else {
          setCategories([
            { id: 'all', label: 'Todos los Momentos', label_en: 'All Moments', icon: LayoutGrid }
          ]);
        }

        setDbImages(imgRes || []);
      } catch (e) {
        console.error('Error loading dynamic gallery data', e);
        setCategories([
          { id: 'all', label: 'Todos los Momentos', label_en: 'All Moments', icon: LayoutGrid }
        ]);
        setDbImages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGalleryData();
  }, [showSection]);

  if (!showSection) return null;

  const filteredImages = activeCategory === 'all'
    ? dbImages
    : dbImages.filter(img => img.category_id === activeCategory);

  // Limit to 12 images for the grid
  const displayedImages = filteredImages.slice(0, 12);
  const remainingCount = filteredImages.length - 11; // Since the 12th image is the overlay

  // Prepare stories for Instagram Stories viewer
  const stories = filteredImages.map((img) => ({
    content: () => (
      <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <motion.img
          src={img.src}
          alt={locale === 'en' && img.title_en ? img.title_en : img.title}
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ 
            duration: 6,
            ease: "linear"
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute inset-x-0 bottom-0 pt-32 pb-16 px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold mb-3 text-amber-200 drop-shadow-md font-display">
              {locale === 'en' && img.title_en ? img.title_en : img.title}
            </h3>
            <div className="w-12 h-0.5 bg-amber-200/50 mx-auto mb-4" />
            <p className="text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed text-white/95 drop-shadow-sm italic font-body">
              "{locale === 'en' && img.description_en ? img.description_en : img.description}"
            </p>
          </motion.div>
        </div>
      </div>
    )
  }));

  return (
    <section id="galeria" className="py-24 bg-cream relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <FadeInScroll className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-terracotta uppercase tracking-[0.2em]">
            {t('Vida en la Ceiba')}
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-forest">
            {t('Nuestra Galería')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('Momentos cotidianos de exploración, descubrimiento y crecimiento en nuestros ambientes Montessori.')}
          </p>
        </FadeInScroll>

        {/* Category Pills Selector */}
        <FadeInScroll delay={0.2} className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <Magnetic key={cat.id}>
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-forest text-white shadow-md scale-105'
                      : 'bg-white/80 text-forest hover:bg-white hover:scale-102 border border-forest/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{locale === 'en' ? cat.label_en : cat.label}</span>
                </button>
              </Magnetic>
            );
          })}
        </FadeInScroll>

        {/* Grid Images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {displayedImages.map((img, idx) => {
              const isLastItem = idx === 11 && filteredImages.length > 12;
              const displayTitle = locale === 'en' && img.title_en ? img.title_en : img.title;

              return (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setStoryIndex(idx)}
                  className="relative group cursor-pointer aspect-square rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all"
                >
                  <img
                    src={img.src}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Hover Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <h4 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                      {displayTitle}
                    </h4>
                    <p className="text-white/80 text-xs line-clamp-2 italic">
                      "{locale === 'en' && img.description_en ? img.description_en : img.description}"
                    </p>
                  </div>

                  {/* Remaining Count Overlay on 12th card if more exist */}
                  {isLastItem && (
                    <div className="absolute inset-0 bg-forest/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <span className="font-display font-bold text-3xl sm:text-4xl">
                        +{remainingCount}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider mt-1 text-white/90">
                        {t('Ver todos los momentos')}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Story Modal Viewer */}
        <AnimatePresence>
          {storyIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            >
              <button
                onClick={() => setStoryIndex(null)}
                className="absolute top-6 right-6 z-50 p-2 text-white/80 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full max-w-lg h-[90vh] rounded-3xl overflow-hidden relative">
                <Stories
                  stories={stories}
                  defaultInterval={6000}
                  currentIndex={storyIndex}
                  onStoryEnd={() => {
                    if (storyIndex < stories.length - 1) {
                      setStoryIndex(storyIndex + 1);
                    } else {
                      setStoryIndex(null);
                    }
                  }}
                  onAllStoriesEnd={() => setStoryIndex(null)}
                  width="100%"
                  height="100%"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

export default GallerySection;

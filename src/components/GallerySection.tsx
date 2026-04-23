import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Settings, Hand, Trees, Palette, LucideIcon, X } from 'lucide-react';
import Stories from 'react-insta-stories';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { Magnetic } from './ui/magnetic';
import galleryData from '@/data/gallery.json';

interface LocalizedText {
    es: string;
    en: string;
}

interface GalleryImage {
    id: number;
    category: string;
    src: string;
    alt: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
}

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

    const showSection = import.meta.env.VITE_SHOW_GALLERY_SECTION === 'true';
    if (!showSection) return null;

    const categories: Category[] = galleryData.categories.map(cat => ({
        ...cat,
        icon: ICON_MAP[cat.id] || LayoutGrid
    }));

    const galleryImages = galleryData.images as GalleryImage[];

    const filteredImages = activeCategory === 'all'
        ? galleryImages
        : galleryImages.filter(img => img.category === activeCategory);

    // Limit to 12 images for the grid
    const displayedImages = filteredImages.slice(0, 12);
    const hasMore = filteredImages.length > 12;
    const remainingCount = filteredImages.length - 11; // Since the 12th image is the overlay

    // Prepare stories for all filtered images
    const stories = filteredImages.map((img) => ({
        content: () => (
            <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                {/* Background Image with subtle zoom-in effect */}
                <motion.img
                    src={img.src}
                    alt={locale === 'en' ? img.alt.en : img.alt.es}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.08 }}
                    transition={{ 
                        duration: 6, // Matches the story duration slightly plus some buffer
                        ease: "linear"
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Text Overlay - Dark gradient from bottom */}
                <div className="absolute inset-x-0 bottom-0 pt-32 pb-16 px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-center"
                    >
                        <h3 className="text-2xl font-bold mb-3 text-amber-200 drop-shadow-md">
                            {locale === 'en' ? img.title.en : img.title.es}
                        </h3>
                        <div className="w-12 h-0.5 bg-amber-200/50 mx-auto mb-4" />
                        <p className="text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed text-white/95 drop-shadow-sm italic">
                            "{locale === 'en' ? img.description.en : img.description.es}"
                        </p>
                    </motion.div>
                </div>
            </div>
        )
    }));

    // Prevent scrolling when story is open
    useEffect(() => {
        if (storyIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [storyIndex]);

    return (
        <section id="galeria" className="section-padding bg-cream/50 overflow-hidden relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <FadeInScroll className="text-center mb-12">
                    <span className="text-secondary-foreground/60 font-medium text-sm uppercase tracking-wider">
                        {t('Vida en Ceiba')}
                    </span>
                    <h2 className="heading-section text-foreground mt-2">
                        {t('Nuestra Galería')}
                    </h2>
                </FadeInScroll>

                {/* Filter Bar */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex flex-wrap justify-center items-center gap-2 p-2 bg-transparent rounded-[2rem] border-2 border-leaf/10">
                        {categories.map((cat) => (
                            <Magnetic key={cat.id} strength={0.1}>
                                <button
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm transition-all duration-300 ${activeCategory === cat.id
                                        ? 'text-leaf font-bold bg-leaf/10 border-2 border-leaf scale-105'
                                        : 'text-foreground/70 font-medium hover:bg-leaf/5'
                                        }`}
                                >
                                    <cat.icon className="w-4 h-4" />
                                    {locale === 'en' ? cat.label_en : cat.label}
                                </button>
                            </Magnetic>
                        ))}
                    </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {displayedImages.map((image, index) => {
                            const isLastDisplayed = index === 11 && hasMore;

                            return (
                                <FadeInScroll 
                                    key={image.id} 
                                    delay={index * 0.05}
                                    className="h-full"
                                >
                                    <motion.div
                                        layout
                                        whileHover={{ y: -8 }}
                                        onClick={() => setStoryIndex(index)}
                                        className="aspect-square relative group overflow-hidden rounded-[2.5rem] shadow-lg cursor-pointer"
                                    >
                                        <img
                                            src={image.src}
                                            alt={locale === 'en' ? image.alt.en : image.alt.es}
                                            title={locale === 'en' ? image.title.en : image.title.es}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {isLastDisplayed ? (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                                                <span className="text-4xl font-bold">+{remainingCount}</span>
                                                <span className="text-sm font-medium uppercase tracking-widest mt-2">{t('Ver más')}</span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <div className="text-white">
                                                    <p className="text-sm font-bold mb-1">
                                                        {locale === 'en' ? image.title.en : image.title.es}
                                                    </p>
                                                    <p className="text-xs font-medium line-clamp-2 opacity-90">
                                                        {locale === 'en' ? image.description.en : image.description.es}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </FadeInScroll>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Story Viewer Overlay */}
            <AnimatePresence>
                {storyIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setStoryIndex(null)}
                            className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <div className="w-full h-full max-w-lg md:h-[90vh] flex items-center justify-center">
                            <Stories
                                stories={stories}
                                defaultInterval={6000}
                                width="100%"
                                height="100%"
                                currentIndex={storyIndex}
                                onStoryEnd={(s, i) => {
                                    if (i === stories.length - 1) {
                                        setStoryIndex(null);
                                    }
                                }}
                                onAllStoriesEnd={() => setStoryIndex(null)}
                                keyboardNavigation
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

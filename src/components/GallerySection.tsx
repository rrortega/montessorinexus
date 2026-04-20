import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Settings, Hand, Trees, Palette, LucideIcon } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import galleryData from '@/data/gallery.json';

interface GalleryImage {
    id: number;
    category: string;
    src: string;
    alt: string;
}

interface Category {
    id: string;
    label: string;
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
    const { t } = useI18n();
    const showSection = import.meta.env.VITE_SHOW_GALLERY_SECTION === 'true';

    if (!showSection) return null;

    const [activeCategory, setActiveCategory] = useState('all');

    const categories: Category[] = galleryData.categories.map(cat => ({
        ...cat,
        icon: ICON_MAP[cat.id] || LayoutGrid
    }));

    const galleryImages = galleryData.images as GalleryImage[];

    const filteredImages = activeCategory === 'all'
        ? galleryImages
        : galleryImages.filter(img => img.category === activeCategory);

    return (
        <section id="galeria" className="section-padding bg-cream/50 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-secondary-foreground/60 font-medium text-sm uppercase tracking-wider">
                        {t('Vida en Ceiba')}
                    </span>
                    <h2 className="heading-section text-foreground mt-2">
                        {t('Nuestra Galería')}
                    </h2>
                </motion.div>

                {/* Filter Bar */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex flex-wrap justify-center items-center gap-2 p-2 bg-transparent rounded-[2rem] border-2 border-leaf/10">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm transition-all duration-300 ${activeCategory === cat.id
                                    ? 'text-leaf font-bold bg-leaf/10 border-2 border-leaf scale-105'
                                    : 'text-foreground/70 font-medium hover:bg-leaf/5'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {t(cat.label)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Image Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredImages.map((image) => (
                            <motion.div
                                key={image.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                className="aspect-square relative group overflow-hidden rounded-[2.5rem] shadow-lg cursor-pointer"
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <p className="text-white text-sm font-medium">{t(image.alt)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}

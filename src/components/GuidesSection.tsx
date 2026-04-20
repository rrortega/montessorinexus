import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';
import guidesData from '@/data/guides.json';

interface Guide {
    name: string;
    role: string;
    image: string;
}

const guides = guidesData as Guide[];

export function GuidesSection() {
    const { t } = useI18n();
    const showSection = import.meta.env.VITE_SHOW_TEACHERS_SECTION === 'true';

    if (!showSection) return null;

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        loop: true,
        skipSnaps: false,
    });

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    return (
        <section id="guias" className="relative bg-terracotta text-white pb-24 overflow-hidden">
            {/* Wavy/Cloud Divider */}


            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="heading-section text-white mb-4">
                        {t('Meet Our Professional Teachers')}
                    </h2>
                    <p className="text-white/80 max-w-2xl mx-auto">
                        {t('Get to know the passionate and experienced educators who create a nurturing, fun, and inspiring environment for every child at Ceiba!')}
                    </p>
                </motion.div>

                {/* Carousel Container */}
                <div className="relative group">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {guides.map((guide, index) => (
                                <div key={index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] px-4 min-w-0">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl mb-6 transform transition-transform duration-500 hover:scale-105 active:scale-95">
                                            <img
                                                src={guide.image}
                                                alt={guide.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-white mb-1">
                                            {t(guide.name)}
                                        </h3>
                                        <p className="text-white/70 text-sm text-center">
                                            {t(guide.role)}
                                        </p>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={scrollPrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 p-3 rounded-full bg-white shadow-xl text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Previous guide"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 p-3 rounded-full bg-white shadow-xl text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Next guide"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
}

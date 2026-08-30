import React, { useState } from 'react';
import { Globe, Plus, Minus, RotateCcw } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

export interface CountryMetric {
 code: string; // 2-letter ISO e.g. "MX", "US" or name
 name?: string;
 views: number;
 percentage?: number;
}

interface WorldMapMetricsProps {
 countries: CountryMetric[];
}

const geoUrl = '/world-110m.json';

// Mapping from Country Code/Name to Flag, Display Name, and TopoJSON Country Name
const countryLookup: Record<string, { iso2: string; name: string; flag: string; matchNames: string[] }> = {
 MX: { iso2: 'MX', name: 'México', flag: '🇲🇽', matchNames: ['Mexico', 'México'] },
 US: { iso2: 'US', name: 'Estados Unidos', flag: '🇺🇸', matchNames: ['United States of America', 'United States'] },
 CA: { iso2: 'CA', name: 'Canadá', flag: '🇨🇦', matchNames: ['Canada'] },
 ES: { iso2: 'ES', name: 'España', flag: '🇪🇸', matchNames: ['Spain'] },
 CO: { iso2: 'CO', name: 'Colombia', flag: '🇨🇴', matchNames: ['Colombia'] },
 AR: { iso2: 'AR', name: 'Argentina', flag: '🇦🇷', matchNames: ['Argentina'] },
 CL: { iso2: 'CL', name: 'Chile', flag: '🇨🇱', matchNames: ['Chile'] },
 PE: { iso2: 'PE', name: 'Perú', flag: '🇵🇪', matchNames: ['Peru'] },
 GT: { iso2: 'GT', name: 'Guatemala', flag: '🇬🇹', matchNames: ['Guatemala'] },
 CR: { iso2: 'CR', name: 'Costa Rica', flag: '🇨🇷', matchNames: ['Costa Rica'] },
 DE: { iso2: 'DE', name: 'Alemania', flag: '🇩🇪', matchNames: ['Germany'] },
 FR: { iso2: 'FR', name: 'Francia', flag: '🇫🇷', matchNames: ['France'] },
 GB: { iso2: 'GB', name: 'Reino Unido', flag: '🇬🇧', matchNames: ['United Kingdom'] },
 BR: { iso2: 'BR', name: 'Brasil', flag: '🇧🇷', matchNames: ['Brazil'] },
};

export const WorldMapMetrics: React.FC<WorldMapMetricsProps> = ({ countries }) => {
 const [zoom, setZoom] = useState(1.3);
 const [center, setCenter] = useState<[number, number]>([0, 15]);

 const totalViews = countries.reduce((sum, c) => sum + c.views, 0) || 1;

 const processedCountries = countries.length > 0 ? countries.map(c => {
 const codeKey = (c.code || '').toUpperCase();
 const info = countryLookup[codeKey] || { iso2: codeKey, name: c.name || codeKey, flag: '', matchNames: [c.name || codeKey] };
 return {
 code: codeKey,
 name: info.name,
 flag: info.flag,
 matchNames: info.matchNames,
 views: c.views,
 percentage: Math.round((c.views / totalViews) * 100),
 };
 }) : [
 { code: 'MX', name: 'México', flag: '🇲🇽', matchNames: ['Mexico'], views: 1840, percentage: 68 },
 { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', matchNames: ['United States of America'], views: 520, percentage: 19 },
 { code: 'CA', name: 'Canadá', flag: '🇨🇦', matchNames: ['Canada'], views: 190, percentage: 7 },
 { code: 'ES', name: 'España', flag: '🇪🇸', matchNames: ['Spain'], views: 110, percentage: 4 },
 { code: 'CO', name: 'Colombia', flag: '🇨🇴', matchNames: ['Colombia'], views: 50, percentage: 2 },
 ];

 const maxViews = Math.max(...processedCountries.map(c => c.views), 1);

 // Color scale for active map countries
 const colorScale = scaleLinear<string>()
 .domain([0, maxViews])
 .range(['#81c784', '#1b4332']);

 const getCountryColor = (geoName: string) => {
 const match = processedCountries.find(c => 
 c.matchNames.some(m => m.toLowerCase() === geoName.toLowerCase()) ||
 c.name.toLowerCase() === geoName.toLowerCase()
 );

 if (match) {
 return colorScale(match.views);
 }
 return '#e5e7eb'; // Light gray for non-active countries
 };

 const getCountryViews = (geoName: string) => {
 const match = processedCountries.find(c => 
 c.matchNames.some(m => m.toLowerCase() === geoName.toLowerCase()) ||
 c.name.toLowerCase() === geoName.toLowerCase()
 );
 return match ? match.views : 0;
 };

 const handleZoomIn = () => {
 if (zoom < 4) setZoom(prev => prev + 0.4);
 };

 const handleZoomOut = () => {
 if (zoom > 0.8) setZoom(prev => prev - 0.4);
 };

 const handleResetZoom = () => {
 setZoom(1.3);
 setCenter([0, 15]);
 };

 return (
 <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm space-y-6 font-body">
 
 {/* Header */}
 <div className="flex items-center justify-between border-b border-forest/10 pb-4">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-forest uppercase tracking-wider mb-0.5">
 <Globe className="w-4 h-4 text-terracotta" />
 <span>Mapa de Accesos Globales</span>
 </div>
 <h3 className="font-display font-bold text-forest text-lg">Distribución por Países</h3>
 </div>
 <div className="px-3 py-1 bg-forest/10 text-forest rounded-full text-xs font-semibold">
 {processedCountries.length} Países Registrados
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
 
 {/* React Simple Maps Container with Zoom Controls */}
 <div className="lg:col-span-2 relative p-2 bg-cream/40 rounded-2xl border border-forest/10 flex items-center justify-center overflow-hidden h-[360px]">
 
 {/* Zoom Buttons Overlay */}
 <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-forest/10">
 <button
 onClick={handleZoomIn}
 className="p-1.5 hover:bg-forest/10 text-forest rounded-lg transition-colors"
 title="Acercar (Zoom +)"
 >
 <Plus className="w-4 h-4" />
 </button>
 <button
 onClick={handleZoomOut}
 className="p-1.5 hover:bg-forest/10 text-forest rounded-lg transition-colors"
 title="Alejar (Zoom -)"
 >
 <Minus className="w-4 h-4" />
 </button>
 <button
 onClick={handleResetZoom}
 className="p-1.5 hover:bg-forest/10 text-forest rounded-lg transition-colors border-t border-forest/10 mt-0.5"
 title="Restablecer Vista"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 </button>
 </div>

 <ComposableMap
 projectionConfig={{ rotate: [-10, 0, 0], scale: 195 }}
 className="w-full h-full"
 >
 <ZoomableGroup 
 center={center} 
 zoom={zoom}
 onMoveEnd={({ coordinates, zoom: newZoom }) => {
 setCenter(coordinates as [number, number]);
 setZoom(newZoom);
 }}
 >
 <Geographies geography={geoUrl}>
 {({ geographies }) =>
 geographies.map((geo) => {
 const geoName = geo.properties.name;
 const views = getCountryViews(geoName);
 const fillColor = getCountryColor(geoName);
 return (
 <Geography
 key={geo.rsmKey}
 geography={geo}
 fill={fillColor}
 stroke="#ffffff"
 strokeWidth={0.5}
 style={{
 default: { outline: 'none' },
 hover: { fill: views > 0 ? '#c8553d' : '#cbd5e1', outline: 'none', cursor: views > 0 ? 'pointer' : 'default' },
 pressed: { outline: 'none' },
 }}
 />
 );
 })
 }
 </Geographies>
 </ZoomableGroup>
 </ComposableMap>
 </div>

 {/* Countries Ranking Table */}
 <div className="space-y-3">
 <h4 className="font-display font-semibold text-forest text-xs uppercase tracking-wider mb-2">
 Top Países de Origen
 </h4>

 <div className="space-y-2.5">
 {processedCountries.slice(0, 5).map((item, idx) => (
 <div key={idx} className="space-y-1">
 <div className="flex items-center justify-between text-xs font-semibold text-forest">
 <span className="flex items-center gap-2">
 <span className="text-base leading-none">{item.flag}</span>
 <span>{item.name}</span>
 </span>
 <span className="text-terracotta font-mono font-bold">{item.views.toLocaleString()} ({item.percentage}%)</span>
 </div>
 <div className="w-full h-2 bg-forest/10 rounded-full overflow-hidden">
 <div
 className="h-full bg-forest rounded-full transition-all duration-500"
 style={{ width: `${item.percentage}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>

 </div>

 </div>
 );
};

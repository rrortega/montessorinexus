import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React/Vite
// @ts-expect-error - Leaflet and Vite image import compatibility
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-expect-error - Leaflet and Vite image import compatibility
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    className?: string;
}

const LAT = parseFloat(import.meta.env.VITE_MAP_LAT || "21.1318776");
const LNG = parseFloat(import.meta.env.VITE_MAP_LNG || "-86.87706795");
const POSITION: [number, number] = [LAT, LNG]; // Av. Huayacán, Cancún
const ADDRESS = import.meta.env.VITE_SCHOOL_ADDRESS || "Av. Huayacán, Cancún, Quintana Roo";

export const Map = ({ className }: MapProps) => {
    return (
        <div className={className}>
            <MapContainer
                center={POSITION}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full rounded-2xl z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={POSITION}>
                    <Popup>
                        Ceiba Montessori <br /> Av. Huayacán, Cancún.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default Map;

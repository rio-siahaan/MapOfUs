"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MemoryForm from "./MemoryForm";
import AuthModal from "./AuthModal";
import { createClient } from "@/lib/supabase-client";
import { LogIn, LogOut } from "lucide-react";

// Fix for default Leaflet markers in Next.js
const fixLeafletIcon = () => {
  // @ts-expect-error - _getIconUrl is a private property but necessary to delete for the fix
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    // iconUrl:
      // "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconUrl:
      "/location.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [35,35],
  });
};

// Component to handle map clicks
function MapEvents({
  onMapClick,
}: {
  onMapClick: (e: L.LeafletMouseEvent) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

// Component to recenter map when location changes
function RecenterMap({ location }: { location: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(location, 13);
  }, [location, map]);
  return null;
}

interface MemoryMarker {
  id: string; // UUID from Supabase
  latitude: number;
  longitude: number;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function Map({ interactive = true }: { interactive?: boolean }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [markers, setMarkers] = useState<MemoryMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fixLeafletIcon();
    fetchMemories();

    // Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Jakarta if permission denied or error
          setUserLocation([-6.2088, 106.8456]);
        },
      );
    } else {
      setUserLocation([-6.2088, 106.8456]);
    }

    // Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemories = async () => {
    const { data, error } = await supabase.from("memories").select("*");

    if (error) {
      console.error("Error fetching memories:", error);
    } else {
      setMarkers(data || []);
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!interactive) return;

    if (!user) {
      router.push('/auth')
      return;
    }
    // Set temporary marker at clicked location
    setTempMarker({
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    });
  };

  const handleMemorySaved = () => {
    setTempMarker(null);
    fetchMemories(); // Refresh markers
  };

  const handleCancel = () => {
    setTempMarker(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <p>Locating you...</p>
      </div>
    );
  }

  const handleRandomMemory = () => {
    if (markers.length === 0) {
      alert("No memories available yet!");
      return;
    }

    // Pick random marker
    const randomIndex = Math.floor(Math.random() * markers.length);
    const randomMarker = markers[randomIndex];

    // Fly to the random marker location
    setUserLocation([randomMarker.latitude, randomMarker.longitude]);
  };

  return (
    <>
      <div
        className={`relative w-full h-screen transition-all duration-300 ${isAuthModalOpen ? "blur-sm pointer-events-none" : ""}`}
      >
        {/* Random Memorfy Button */}
        {markers.length > 0 && (
          <div className="absolute z-[1000] bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleRandomMemory}
              className="group relative px-6 py-3 rounded-full 
                         bg-gradient-to-r from-purple-600 to-rose-500 
                         text-white font-semibold text-sm
                         shadow-[0_0_20px_rgba(139,92,246,0.3)]
                         hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                         hover:scale-105
                         transition-all duration-300
                         cursor-pointer
                         border border-white/20"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin-slow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Discover Random Memory
              </span>
            </button>
          </div>
        )}
        {/* Auth Button Overlay */}
        {interactive && (
          <div className="absolute top-4 right-4 z-[1000]">
            {!user ? (
              <a
                href="/auth"
                className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md text-white rounded-full hover:bg-black/90 transition-all shadow-lg font-medium text-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Login
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md text-red-600 rounded-full hover:bg-white transition-all shadow-lg font-medium text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        <MapContainer
          center={userLocation}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false} // We can add custom zoom control later if needed, keeps UI clean
        >
          <RecenterMap location={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Existing Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
            >
              <Tooltip direction="top" opacity={1} className="memory-tooltip">
                <div
                  className="relative w-64 rounded-2xl overflow-hidden 
                  bg-gradient-to-br from-zinc-900/95 to-black/95
                  border border-white/10 
                  shadow-[0_0_40px_rgba(139,92,246,0.2)]
                  text-white backdrop-blur-xl"
                >
                  {/* Glow accents */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-rose-500/20 rounded-full blur-3xl" />

                  {marker.image_url && (
                    <div className="relative">
                      <img
                        src={marker.image_url}
                        alt="Memory"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                  )}

                  <div className="p-4 relative z-10">
                    <p className="text-sm leading-relaxed text-zinc-200 italic">
                      “{marker.content}”
                    </p>

                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-zinc-400">
                        {new Date(marker.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* Temporary Marker for New Memory */}
          {tempMarker && (
            <Marker position={[tempMarker.lat, tempMarker.lng]}>
              <Popup minWidth={300} closeButton={false}>
                <MemoryForm
                  lat={tempMarker.lat}
                  lng={tempMarker.lng}
                  onSuccess={handleMemorySaved}
                  onCancel={handleCancel}
                />
              </Popup>
            </Marker>
          )}

          <MapEvents onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      /> */}
    </>
  );
}

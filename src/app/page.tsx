"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading Map...</p>,
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <Map />
    </div>
  );
}

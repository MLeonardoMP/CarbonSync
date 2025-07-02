import { GeoVisorClient } from "@/components/geo-visor/geo-visor-client";

export default function GeoVisorPage() {
    // This API key is required by the Google Maps API. 
    // The user should replace the placeholder in the .env.local file.
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-center text-red-500">
                    Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
                </p>
            </div>
        );
    }
    
    return <GeoVisorClient apiKey={apiKey} />;
}

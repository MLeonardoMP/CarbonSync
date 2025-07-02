import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
    // This API key is required by Mapbox. 
    // The user should replace the placeholder in the .env.local file.
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    
    return <DashboardClient mapboxToken={mapboxToken} />;
}

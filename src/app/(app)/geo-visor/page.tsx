import { GeoVisorClient } from "@/components/geo-visor/geo-visor-client";
import { Globe } from "lucide-react";

export default function GeoVisorPage() {
    // This API key is required by the Google Maps API. 
    // The user should replace the placeholder in the .env.local file.
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.24))] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-lg max-w-lg">
                    <div className="rounded-full border-4 border-primary/20 bg-primary/10 p-4">
                         <Globe className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-card-foreground">Google Maps API Key Required</h3>
                        <p className="mt-2 max-w-md text-muted-foreground">
                            To display the Geo-Visor map, please provide a valid Google Maps JavaScript API key.
                        </p>
                    </div>
                    <div className="w-full text-left text-sm">
                        <p className="font-medium text-card-foreground">1. Create a <code className="font-mono text-sm bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">.env.local</code> file in your project's root directory if it doesn't exist.</p>
                        <p className="mt-2 font-medium text-card-foreground">2. Add your API key to the file:</p>
                        <pre className="mt-2 w-full rounded-md bg-slate-900 p-4 overflow-x-auto">
                            <code className="text-white">
                                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="PASTE_YOUR_KEY_HERE"
                            </code>
                        </pre>
                         <p className="mt-4 text-xs text-muted-foreground">
                            <strong>Note:</strong> After adding the key, you'll need to restart the development server for the change to take effect.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return <GeoVisorClient apiKey={apiKey} />;
}

import { CO2CalculatorClient } from '@/components/co2-calculator/co2-calculator-client';
import { MapPin } from "lucide-react";

export default function CO2CalculatorPage() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken || mapboxToken === "YOUR_MAPBOX_ACCESS_TOKEN") {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.24))] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-lg max-w-lg">
                    <div className="rounded-full border-4 border-primary/20 bg-primary/10 p-4">
                         <MapPin className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-card-foreground">Mapbox Access Token Required</h3>
                        <p className="mt-2 max-w-md text-muted-foreground">
                            To display the map, please provide a valid Mapbox access token.
                        </p>
                    </div>
                    <div className="w-full text-left text-sm">
                        <p className="font-medium text-card-foreground">1. Create a <code className="font-mono text-sm bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">.env.local</code> file in your project's root directory if it doesn't exist.</p>
                        <p className="mt-2 font-medium text-card-foreground">2. Add your access token to the file:</p>
                        <pre className="mt-2 w-full rounded-md bg-slate-900 p-4 overflow-x-auto">
                            <code className="text-white">
                                NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="PASTE_YOUR_TOKEN_HERE"
                            </code>
                        </pre>
                         <p className="mt-4 text-xs text-muted-foreground">
                            <strong>Note:</strong> After adding the token, you'll need to restart the development server for the change to take effect.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <CO2CalculatorClient mapboxToken={mapboxToken} />;
}

import { RouteOptimizerClient } from '@/components/route-optimizer/route-optimizer-client';

export default function RouteOptimizerPage() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    return <RouteOptimizerClient mapboxToken={mapboxToken} />;
}

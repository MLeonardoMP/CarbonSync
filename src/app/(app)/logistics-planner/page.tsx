import { LogisticsPlannerClient } from '@/components/logistics-planner/logistics-planner-client';

export default function LogisticsPlannerPage() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    return <LogisticsPlannerClient mapboxToken={mapboxToken} />;
}

import { EnhancedLogisticsPlannerClient } from '@/components/logistics-planner/enhanced-logistics-planner-client';

export default function EnhancedLogisticsPlannerPage() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    return <EnhancedLogisticsPlannerClient mapboxToken={mapboxToken} />;
}

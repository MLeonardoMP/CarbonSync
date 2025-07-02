import { CO2CalculatorClient } from '@/components/co2-calculator/co2-calculator-client';

export default function CO2CalculatorPage() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    return <CO2CalculatorClient mapboxToken={mapboxToken} />;
}

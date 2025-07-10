/**
 * Test script for enhanced logistics planning with web intelligence
 */

const { planEnhancedLogisticsJourney } = require('./src/ai/flows/plan-enhanced-logistics-journey');

async function testEnhancedPlanning() {
  console.log('=== Testing Enhanced Logistics Planning with Web Intelligence ===\n');

  // Test case that might produce the problematic route shown in the image
  const testInput = {
    legs: [
      {
        origin: "Bogotá, Colombia",
        destination: "Callao, Peru",
        cargoWeightTons: 25
      }
    ]
  };

  try {
    console.log(`Testing route: ${testInput.legs[0].origin} → ${testInput.legs[0].destination}`);
    console.log(`Cargo weight: ${testInput.legs[0].cargoWeightTons} tons\n`);

    const result = await planEnhancedLogisticsJourney(testInput);

    console.log('✓ Enhanced route calculation completed successfully!');
    console.log('\n=== Route Analysis ===');
    console.log(`Total Distance: ${result.calculatedRoute.total_distance_km.toFixed(1)} km`);
    console.log(`Total Emissions: ${result.calculatedRoute.totalCO2eEmissions.toFixed(1)} kg CO2e`);
    console.log(`Total Cost: $${result.calculatedRoute.totalEstimatedCost.toFixed(2)}`);
    console.log(`Estimated Time: ${result.calculatedRoute.totalEstimatedTime}`);

    console.log('\n=== Route Segments ===');
    result.calculatedRoute.segments.forEach((segment, i) => {
      console.log(`${i + 1}. ${segment.type.toUpperCase()}: ${segment.description}`);
      console.log(`   Distance: ${segment.distance_km.toFixed(1)} km`);
      console.log(`   Emissions: ${segment.estimatedCO2eEmissions.toFixed(1)} kg CO2e`);
      console.log(`   Cost: $${segment.estimatedCost.toFixed(2)}`);
      console.log(`   Time: ${segment.estimatedTime}`);
      console.log('');
    });

    console.log('=== Enhanced Analysis ===');
    console.log(`Sea Distance: ${result.analysis.seaDistance.toFixed(1)} km`);
    console.log(`Land Distance: ${result.analysis.landDistance.toFixed(1)} km`);
    console.log(`Major Ports: ${result.analysis.majorPorts.join(', ')}`);

    if (result.analysis.riskAssessment) {
      console.log(`\nRisk Level: ${result.analysis.riskAssessment.overall.toUpperCase()}`);
      if (result.analysis.riskAssessment.factors.length > 0) {
        console.log('Risk Factors:');
        result.analysis.riskAssessment.factors.forEach(factor => console.log(`  - ${factor}`));
      }
      if (result.analysis.riskAssessment.mitigations.length > 0) {
        console.log('Risk Mitigations:');
        result.analysis.riskAssessment.mitigations.forEach(mitigation => console.log(`  - ${mitigation}`));
      }
    }

    if (result.analysis.optimizations) {
      if (result.analysis.optimizations.alternativeRoutes.length > 0) {
        console.log('\nAlternative Routes:');
        result.analysis.optimizations.alternativeRoutes.forEach(route => console.log(`  - ${route}`));
      }
      if (result.analysis.optimizations.timingRecommendations.length > 0) {
        console.log('\nTiming Recommendations:');
        result.analysis.optimizations.timingRecommendations.forEach(rec => console.log(`  - ${rec}`));
      }
    }

    if (result.analysis.marketConditions) {
      console.log('\n=== Market Conditions ===');
      console.log(`Fuel Prices: ${result.analysis.marketConditions.fuelPrices}`);
      console.log(`Port Congestion: ${result.analysis.marketConditions.portCongestion}`);
      console.log(`Seasonal Factors: ${result.analysis.marketConditions.seasonalFactors}`);
    }

  } catch (error) {
    console.error('✗ Error testing enhanced planning:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testEnhancedPlanning().then(() => {
  console.log('\n=== Test completed ===');
}).catch(error => {
  console.error('Test failed:', error);
});

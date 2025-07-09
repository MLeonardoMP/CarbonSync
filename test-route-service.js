const { spawn } = require('child_process');
const path = require('path');

// Test the enhanced route service
async function testEnhancedRouteService() {
  console.log('Testing Enhanced Route Service...\n');
  
  const pythonScriptPath = path.join(process.cwd(), 'src', 'ai', 'enhanced_maritime_routes.py');
  console.log('Python script path:', pythonScriptPath);
  
  const testCases = [
    { origin: 'Shanghai', destination: 'Bogota', description: 'Port to Inland' },
    { origin: 'Shanghai', destination: 'Rotterdam', description: 'Port to Port' },
    { origin: 'Bogota', destination: 'Salt Lake City', description: 'Inland to Inland' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.description} ===`);
    console.log(`Route: ${testCase.origin} → ${testCase.destination}`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [pythonScriptPath, 'calculate_route', testCase.origin, testCase.destination], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Process failed with code ${code}: ${errorData}`));
            return;
          }

          try {
            const parsedResult = JSON.parse(outputData);
            resolve(parsedResult);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}\nOutput: ${outputData}`));
          }
        });

        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start process: ${error.message}`));
        });
      });

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      } else {
        console.log(`✅ Success: ${result.route_description}`);
        console.log(`   Distance: ${result.total_distance_km.toFixed(1)} km`);
        console.log(`   Waypoints: ${result.total_waypoints}`);
        console.log(`   Segments: ${result.segments.length}`);
        
        result.segments.forEach((segment, i) => {
          console.log(`     ${i + 1}. ${segment.type.toUpperCase()}: ${segment.description}`);
          console.log(`        ${segment.distance_km.toFixed(1)} km, ${segment.waypoints.length} waypoints`);
        });
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }
}

testEnhancedRouteService().catch(console.error);

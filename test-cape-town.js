const { spawn } = require('child_process');
const path = require('path');

// Test specific routes to Cape Town
async function testCapeGownRoutes() {
  console.log('Testing Cape Town Routes...\n');
  
  const pythonScriptPath = path.join(process.cwd(), 'src', 'ai', 'enhanced_maritime_routes.py');
  console.log('Python script path:', pythonScriptPath);
  
  const testCases = [
    { origin: 'Shanghai', destination: 'Cape Town', description: 'Shanghai to Cape Town' },
    { origin: 'New York', destination: 'Cape Town', description: 'New York to Cape Town' },
    { origin: 'Rotterdam', destination: 'Cape Town', description: 'Rotterdam to Cape Town' },
    { origin: 'Lagos', destination: 'Cape Town', description: 'Lagos to Cape Town' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.description} ===`);
    console.log(`Route: ${testCase.origin} -> ${testCase.destination}`);
    
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
            reject(new Error(`Failed to parse JSON: ${error.message}\nOutput: ${outputData}\nError: ${errorData}`));
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

testCapeGownRoutes().catch(console.error);

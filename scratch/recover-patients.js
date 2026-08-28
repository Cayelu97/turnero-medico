import fs from 'fs';
import path from 'path';

async function recover() {
  const brainDir = 'C:/Users/macena/.gemini/antigravity/brain';
  const convs = fs.readdirSync(brainDir);

  for (const c of convs.reverse()) {
    const tPath = path.join(brainDir, c, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (fs.existsSync(tPath)) {
      const stats = fs.statSync(tPath);
      if (stats.size > 10000) {
        console.log(`Checking ${c} (${stats.size} bytes)...`);
        const content = fs.readFileSync(tPath, 'utf8');
        
        // Search for pac- occurrences
        const pacMatches = content.match(/\"id\":\s*\"pac-[^\"]+\"/g);
        if (pacMatches && pacMatches.length > 50) {
          console.log(`Found ${pacMatches.length} patient ID matches in conv ${c}!`);
          
          // Let's find any JSON object that contains a large array of pacientes
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.includes('mediturnos_pacientes') || line.includes('pacientes')) {
              try {
                const parsed = JSON.parse(line);
                // Look for arrays inside parsed
                const findArrays = (obj) => {
                  if (!obj) return false;
                  if (Array.isArray(obj)) {
                    if (obj.length > 50 && obj[0] && (obj[0].dni || obj[0].nombre)) {
                      console.log('FOUND PACIENTES ARRAY OF LENGTH:', obj.length);
                      fs.writeFileSync('c:/Turnero/scratch/recovered_pacientes.json', JSON.stringify(obj, null, 2));
                      return true;
                    }
                  } else if (typeof obj === 'object') {
                    for (const k of Object.keys(obj)) {
                      if (findArrays(obj[k])) return true;
                    }
                  }
                  return false;
                };
                if (findArrays(parsed)) {
                  console.log('RECOVERED AND SAVED!');
                  return;
                }
              } catch (e) {}
            }
          }
        }
      }
    }
  }
}

recover();

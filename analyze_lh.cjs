const fs = require('fs');
const data = JSON.parse(fs.readFileSync('docs/keeptrip-app-staging.web.app-20260416T170704.json', 'utf8'));
const audits = data.audits;

const failed = Object.values(audits).filter(a => 
  a.score !== null && 
  a.score < 0.9 && 
  a.scoreDisplayMode !== 'manual' && 
  a.scoreDisplayMode !== 'notApplicable'
);

console.log('Performance Score:', data.categories.performance.score * 100);
console.log('\n--- FAILED AUDITS ---');

failed.sort((a,b) => a.score - b.score).forEach(a => {
  console.log(`\n${a.title} (Score: ${a.score}) [${a.id}]`);
  if (a.displayValue) console.log(`Value: ${a.displayValue}`);
  console.log(`Description: ${a.description.split('.')[0]}`);
  if (a.details && a.details.items) {
    console.log('Top items:');
    a.details.items.slice(0, 5).forEach(i => console.log(' - ' + JSON.stringify(i).substring(0, 150)));
  }
});

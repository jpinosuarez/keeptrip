const fs = require('fs');
const data = JSON.parse(fs.readFileSync('docs/keeptrip-app-staging.web.app-20260416T180059.json', 'utf8'));
const audits = data.audits;

const failed = Object.values(audits).filter(a => 
  a.score !== null && 
  a.score < 0.95 && 
  a.scoreDisplayMode !== 'manual' && 
  a.scoreDisplayMode !== 'notApplicable'
);

console.log('Performance Score:', data.categories.performance.score * 100);
console.log('\n--- AREAS OF IMPROVEMENT (Score < 0.95) ---');

failed.sort((a,b) => a.score - b.score).forEach(a => {
  console.log(`\n${a.title} (Score: ${a.score}) [${a.id}]`);
  if (a.displayValue) console.log(`Value: ${a.displayValue}`);
  console.log(`Description: ${a.description.split('.')[0]}`);
  if (a.details && a.details.items) {
    console.log('Top items:');
    a.details.items.slice(0, 3).forEach(i => console.log(' - ' + JSON.stringify(i).substring(0, 150)));
  }
});

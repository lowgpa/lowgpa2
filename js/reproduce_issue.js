const months = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
// Fix: For the first group (19-Jan), change year match:
// Instead of (?:[-\\s]\\d{2,4})?
// Use (?:[-\\s]\\d{4}|[-\\s]\\d{2}(?![-_\\w]))? 
// stricter: (?![-A-Za-z])?
const regex = new RegExp(`\\b(?:(\\d{1,2}[-\\s](?:${months})[a-z]*(?:[-\\s]\\d{4}|[-\\s]\\d{2}(?![-A-Za-z]))?)|((?:${months})[a-z]*[-\\s]\\d{1,2}(?:[-\\s],?\\s?\\d{2,4})?)|(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4}))\\b`, 'gi');

const rawContent = "Got Correction 19-Jan 21-Jan";
const matches = [...String(rawContent).matchAll(regex)];

console.log(`Input: "${rawContent}"`);
console.log(`Found ${matches.length} matches.`);

matches.forEach((match, i) => {
    console.log(`Match ${i + 1}: ${match[0]}`);
});

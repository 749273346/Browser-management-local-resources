const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, 'assets/icon.png');
console.log('Checking icon at:', iconPath);

try {
  const buffer = fs.readFileSync(iconPath);
  console.log('Buffer length:', buffer.length);
  const magic = buffer.subarray(0, 8).toString('hex').toUpperCase();
  console.log('First 8 bytes:', magic);
  
  if (magic === '89504E470D0A1A0A') {
      console.log('Magic bytes match PNG signature.');
  } else {
      console.log('Magic bytes DO NOT match PNG signature.');
  }
} catch (err) {
  console.error('Error:', err);
}

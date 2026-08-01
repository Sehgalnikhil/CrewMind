const fs = require('fs');
const content = fs.readFileSync('src/api/client.ts', 'utf8');
const newContent = content.replace(
  /\(response\) => response,/,
  `(response) => {
    if (typeof response.data === 'string') {
      try {
        const parsed = JSON.parse(response.data);
        if (parsed !== null && typeof parsed === 'object') {
          response.data = parsed;
        }
      } catch (e) {}
    }
    return response;
  },`
);
fs.writeFileSync('src/api/client.ts', newContent);

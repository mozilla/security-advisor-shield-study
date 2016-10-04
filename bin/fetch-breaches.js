const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');

const BREACHES_URL = 'https://haveibeenpwned.com/api/v2/breaches';
const BREACH_PATH = 'data/recommendation/localData.json';

fetch(BREACHES_URL)
  .then((res) => res.json())
  .then((breaches) => {
    fs.writeFileSync(path.resolve(__dirname, '..', BREACH_PATH), JSON.stringify(breaches, null, 2));
    console.info(`Wrote breaches to ${BREACH_PATH}`);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

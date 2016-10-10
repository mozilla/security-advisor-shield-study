const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');
const { stripIndents } = require('common-tags');

const API_BASE_URL = 'https://haveibeenpwned.com/api/v2';

function getBreaches() {
  return fetch(`${API_BASE_URL}/breaches`)
    .then(res => res.json());
}

getBreaches()
  .then(breaches => breaches.map(({ BreachDate, Domain }) => `${Domain} (${BreachDate})`).sort())
  .then((domains) => {
    const output = stripIndents`List of Websites as of ${new Date().toLocaleDateString()}
      Source: ${API_BASE_URL}

      ${domains.join('\n')}`;

    try {
      fs.writeFileSync(path.join(__dirname, '..', 'domains.txt'), `${output.trim()}\n`);
    } catch (err) {
      throw err;
    }
    return domains;
  })
  .catch((err) => {
    console.error(err); // eslint-disable-line no-console
    process.exit(1);
  });

require('dotenv').config();

/* todo require og stilla dót */

const cheerio = require('cheerio');

require('isomorphic-fetch');
const redis = require('redis');
const util = require('util');


const redisOptions = {
  url: 'redis://127.0.0.1:6379/0',
};

const client = redis.createClient(redisOptions);

const asyncGet = util.promisify(client.get).bind(client);
const asyncSet = util.promisify(client.set).bind(client);
const asyncClear = util.promisify(client.flushdb).bind(client);
/**
 * Listi af sviðum með „slug“ fyrir vefþjónustu og viðbættum upplýsingum til
 * að geta sótt gögn.
 */
const departments = [{
  name: 'Félagsvísindasvið',
  slug: 'felagsvisindasvid',
},
{
  name: 'Heilbrigðisvísindasvið',
  slug: 'heilbrigdisvisindasvid',
},
{
  name: 'Hugvísindasvið',
  slug: 'hugvisindasvid',
},
{
  name: 'Menntavísindasvið',
  slug: 'menntavisindasvid',
},
{
  name: 'Verkfræði- og náttúruvísindasvið',
  slug: 'verkfraedi-og-natturuvisindasvid',
},
];

/**
 * Sækir svið eftir `slug`. Fáum gögn annaðhvort beint frá vef eða úr cache.
 *
 * @param {string} slug - Slug fyrir svið sem skal sækja
 * @returns {Promise} Promise sem mun innihalda gögn fyrir svið eða null ef það finnst ekki
 */
async function getTests(slug) {
  const cached = await asyncGet(slug);
  if (cached) {
    return JSON.parse(cached);
  }

  let index;
  await departments.forEach((i, item) => {
    if (slug === i.slug) {
      index = item + 1;
    }
  });

  const response = await fetch(`https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=${index}&notaVinnuToflu=0`);

  const result = await response.text();

  const $ = cheerio.load(JSON.parse(result).html);

  const headers = [];
  $('h3').each((i, element) => {
    headers[i] = $(element).text().trim();
  });

  let courses = [];
  const finalResult = [];
  let values = [];
  $('table').each((i, element) => {
    $(element).find('tbody tr').each((item, course) => {
      $(course).find('td').each((key, value) => {
        values.push($(value).text());
      });
      courses.push({
        course: values[0],
        name: values[1],
        type: values[2],
        students: values[3],
        date: values[4],
      });
      values = [];
    });
    finalResult.push({
      heading: headers[i],
      tests: courses,
    });
    courses = [];
  });

  /* redis test */

  await asyncSet(slug, JSON.stringify(finalResult), 'EX', 30);

  return finalResult;
}
/**
 * Hreinsar cache.
 *
 * @returns {Promise} Promise sem mun innihalda boolean um hvort cache hafi verið hreinsað eða ekki.
 */
async function clearCache() {
  /* todo */
  const result = await asyncClear();

  if (result === 'OK') {
    return true;
  }

  return false;
}

/**
 * Sækir tölfræði fyrir öll próf allra deilda allra sviða.
 *
 * @returns {Promise} Promise sem mun innihalda object með tölfræði um próf
 */
async function getStats() {
  /* todo */
  const data = [];
  departments.forEach((i) => {
    data.push(getTests(i.slug));
  });

  const result = await Promise.all(data);

  let numStudents = 0;
  let numTests = 0;
  const everyNum = [];
  result.forEach((i) => {
    i.forEach((key) => {
      key.tests.forEach((item) => {
        const num = parseInt(item.students, 10);
        numTests += 1;
        numStudents += num;
        everyNum.push(num);
      });
    });
  });

  console.info(everyNum);

  return {
    min: Math.min(...everyNum),
    max: Math.max(...everyNum),
    numTests,
    numStudents,
    averageStudents: numStudents / numTests,
  };
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};

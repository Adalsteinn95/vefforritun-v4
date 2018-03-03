require('dotenv').config();

/* todo require og stilla dót */

const cheerio = require('cheerio');

require('isomorphic-fetch');

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

  /* todo */
  const response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=5&notaVinnuToflu=0');
  const result = await response.text();

  const $ = cheerio.load(JSON.parse(result).html);

  const headers = [];
  $('h3').each((i, element) => {
    headers[i] = $(element).text().trim();
  });

  const courses = [];
  const name = [];
  const type = [];
  const students = [];
  const date = [];
  $('table tbody').each((i, element) => {
    $(element).find('td:nth-child(1)').each((item, course) => {
      courses.push({
        course: { i, course: $(course).text() },
      });
    });
    $(element).find('td:nth-child(2)').each((item, course) => {
      name.push({
        name: { i, name: $(course).text() },
      });
    });
    $(element).find('td:nth-child(3)').each((item, course) => {
      type.push({
        type: { i, type: $(course).text() },
      });
    });
    $(element).find('td:nth-child(4)').each((item, course) => {
      students.push({
        students: { i, students: $(course).text() },
      });
    });
    $(element).find('td:nth-child(5)').each((item, course) => {
      date.push({
        date: { i, date: $(course).text() },
      });
    });
  });

  console.info(courses);

  const finalresult = [];
  courses.forEach((i, index) => {
    finalresult[index] = ({
      course: i.course,
      name: name[index].name,
      type: type[index].type,
      students: students[index].students,
      date: date[index].date,
    });
  });

  return finalresult;
}
/**
 * Hreinsar cache.
 *
 * @returns {Promise} Promise sem mun innihalda boolean um hvort cache hafi verið hreinsað eða ekki.
 */
async function clearCache() {
  /* todo */
}

/**
 * Sækir tölfræði fyrir öll próf allra deilda allra sviða.
 *
 * @returns {Promise} Promise sem mun innihalda object með tölfræði um próf
 */
async function getStats() {
  /* todo */
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};

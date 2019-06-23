const beautify = require('json-beautify');
const cheerio = require('cheerio');
const axios = require('axios');
const _ = require('lodash');
const ora = require('ora');
const fs = require('fs');

exports.storeData = (data, path) => {
  try {
    fs.writeFileSync(path, beautify(data, null, 2, 20));
  } catch (err) {
    console.error(err);
  }
};

exports.loadData = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(err);
    return false;
  }
};

const generateNewOne = () => {
  this.storeData(
    {
      timeout: 60000,
      postsFilename: 'posts.json',
      getPageCount: 10
    }, 'config.json');
};

// TODO: Move this to config.js.
if (!fs.existsSync('config.json')) {
  console.log('It seems like config.json is missing. Generating a new one.');

  generateNewOne();
  console.log();
}

const configuration = this.loadData('config.json');

const spinner = ora();

const instance = axios.create({
  baseURL: 'https://thatnovelcorner.com/',
  timeout: configuration.timeout
});

exports.parseHTML = (htmlstring) => {
  spinner.text = 'Parsing HTML';
  let cleaned = htmlstring.replace(/\n/g, '').replace(/\s{2,}/g, '');
  const $ = cheerio.load(cleaned);

  let posts = [];

  $('.post-container').find('article').each(function (i, element) {
    posts[i] =
            {
              id: $(this).attr('id'),
              title: $(this).find('h1').text(),
              timestamp: Date.parse($(this).find('time').attr('datetime')),
              link: $(this).find('h1').find('a').attr('href')
            };
  });

  return posts;
};

exports.getAllPosts = async () => {
  spinner.start();
  spinner.text = 'Getting all posts';
  let postRequests = [];

  for (let i = 0; i < 5; i++) {
    postRequests.push(instance.get('/', { params: { 'infinity': 'scrolling', 'page': i + 1 } }));
  }

  let responses;

  try {
    responses = await Promise.all(postRequests);
  } catch (ex) {
    if (ex.code === 'ECONNABORTED') {
      spinner.fail(ex.toString() + '\nPlease try again. If error persists, try increasing the timeout in config.json and then try again.');
    } else {
      spinner.fail(ex.toString());
    }
    throw ex;
  }

  let parsedResponses = [];

  for (let response of responses) {
    parsedResponses.push(this.parseHTML(response.data.html));
  }

  const cleanedParsedResponses = _.remove(_.flattenDeep(parsedResponses), (post) => !_.isNaN(post.timestamp));

  spinner.stop();
  return cleanedParsedResponses;
};

exports.getFirstPagePosts = async () => {
  spinner.start();
  spinner.text = 'Getting First Page Posts';

  let response;

  // TODO: Add another common exceptions user might ecounter and add a troubleshoot message.
  try {
    response = await instance.get('/', { params: { 'infinity': 'scrolling', 'page': 1 } });
  } catch (ex) {
    if (ex.code === 'ECONNABORTED') { // TODO: Change this to 'switch'
      spinner.fail(ex.toString() + '\nPlease try again. If error persists, try increasing the timeout in config.json and then try again.');
    } else {
      spinner.fail(ex.toString());
    }
    throw ex;
  }

  return _.remove(this.parseHTML(response.data.html), (post) => !_.isNaN(post.timestamp));
};

exports.checkForNewPosts = async (firstPagePosts) => {
  spinner.start();
  spinner.text = 'Finding Any New Posts';
  const storedPosts = this.loadData(configuration.postsFilename);
  const diff = _.differenceBy(firstPagePosts, storedPosts, 'id');

  spinner.stop();
  return diff;
};

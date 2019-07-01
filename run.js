'use strict';

const inquirer = require('inquirer');
const config = require('./config');
const chalk = require('chalk');
const lib = require('./libs');
const _ = require('lodash');
const path = require('path');
const opn = require('opn');
const fs = require('fs');

var firstRun = false;

const configuration = lib.loadData(path.join(__dirname, 'config.json'));

configuration.postsFilename = path.join(__dirname, configuration.postsFilename);

(async () => {
  if (!fs.existsSync(configuration.postsFilename)) {
    firstRun = true;
    console.log('It seems like ' + configuration.postsFilename + ' is missing. Generating a new one.');

    let allPosts;

    try {
      allPosts = await lib.getAllPosts();
    } catch (ex) {
      // console.log(ex);
      return -1;
    }

    lib.storeData(allPosts, configuration.postsFilename);
  }

  let firstPagePosts;

  try {
    firstPagePosts = await lib.getFirstPagePosts();
  } catch (ex) {
    // console.log(ex);
    return -1;
  }

  // TODO: Move the entire process of updating the posts collection to lib.js
  const diffs = await lib.checkForNewPosts(firstPagePosts);

  const updatedAllPosts = lib.loadData(configuration.postsFilename);
  updatedAllPosts.unshift(...diffs);

  lib.storeData(updatedAllPosts, configuration.postsFilename);

  console.log('Thatnovelcorner.com frontpage posts. New posts are marked with ' + chalk.green('[NEW]') + '.\n');

  for (let post of firstPagePosts) {
    if (_.find(diffs, { id: post.id }) || firstRun) {
      console.log(chalk.green((_.findIndex(firstPagePosts, { 'id': post.id }) + 1) + '.', '[NEW]', post.title));
    } else {
      console.log((_.findIndex(firstPagePosts, { 'id': post.id }) + 1) + '.', post.title);
    }
  }

  console.log();

  const actionAnswer = await inquirer.prompt(
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        'Open to Browser',
        'Change Configuration File',
        'Finish'
      ]
    });

  switch (actionAnswer.action) {
    case 'Finish':
      console.log('Goodbye!');
      return 0;
    case 'Change Configuration File':
      await config.changeConfiguration(); // TODO: Add a mark if configuration is changed to force regenerate`
      console.log('Goodbye!'); // TODO: Make this go to the beginning after changing configuration.
      return 0;
  }

  let openAgainAnswer = false;
  do {
    const postIndexAnswer = await inquirer.prompt(
      {
        type: 'number',
        name: 'post',
        message: 'Which Post?',
        validate: (input) => {
          if (input > 0 && input <= firstPagePosts.length) { return true; }
          return 'Please enter a number in range of 1 to ' + firstPagePosts.length;
        }
      });

    await opn(firstPagePosts[postIndexAnswer.post - 1].link);

    console.log(chalk.yellow('Your default browser is opening the link of the post.'), chalk.yellow.bold('This process may take a few seconds.'));

    openAgainAnswer = await inquirer.prompt(
      {
        type: 'list',
        name: 'openAgain',
        message: 'Want to open another post?',
        choices: [ 'Yes', 'No' ],
        default: 'No',
        filter: (input) => {
          if (input === 'Yes') { // TODO: Change this to 'switch'
            return true;
          } else if (input === 'No') {
            return false;
          } else {
            return false;
          }
        }
      });
  }
  while (openAgainAnswer.openAgain);
})();

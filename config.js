'use strict';

const sanitize = require('sanitize-filename');
const inquirer = require('inquirer');
const lib = require('./libs');

const questions =
[
  {
    type: 'number',
    name: 'timeout',
    message: 'Please input new timeout value',
    default: 60000,
    validate: (input) => {
      if (input > 0) { return true; }
      return 'Please enter a number above 0';
    }
  },
  {
    type: 'input',
    name: 'postsFilename',
    message: 'Please input new filename for storing posts',
    default: 'posts.json',
    validate: (input) => {
      if (input === sanitize(input)) { return true; }
      return 'Illegal character detected';
    }
  },
  {
    type: 'number',
    name: 'getPageCount',
    message: 'How much page do you want to get from the site?',
    default: 10,
    validate: (input) => {
      if (input > 0) { return true; }
      return 'Please enter a number above 0';
    }
  }
];

exports.generateNewOne = () => {
  lib.storeData(
    {
      timeout: 60000,
      postsFilename: 'posts.json',
      getPageCount: 10
    }, 'config.json');
};

exports.changeConfiguration = async () => {
  const JSONData = await inquirer.prompt(questions);
  lib.storeData(JSONData, 'config.json');
};

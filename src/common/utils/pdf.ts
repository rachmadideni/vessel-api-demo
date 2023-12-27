/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path';
import * as fs from 'fs-extra';
import hbs from 'handlebars';
const helpers = require('handlebars-helpers');
const momentHandlers = require('handlebars.moment');

momentHandlers.registerHelpers(hbs);
hbs.registerHelper(helpers());
// https://assemble.io/helpers

const compileHbs = async (templateName: string, data: any) => {
  const filePath = path.join(process.cwd(), 'assets', `template/${templateName}.hbs`);
  const html = await fs.readFile(filePath, 'utf8');
  hbs.registerHelper('eq', function (a, b) {
    return a === b;
  });

  hbs.registerHelper('times', function (n, block) {
    let accum = '';
    for (let i = 0; i < n; ++i) accum += block.fn(i + 1);
    return accum;
  });

  hbs.registerHelper('increment', function (value) {
    return ++value;
  });

  hbs.registerHelper('sum', function (a, b) {
    return a * b;
  });

  hbs.registerHelper('replace', function (find, replace, options) {
    const string = options.fn(this);
    return string.replace(find, replace);
  });

  return hbs.compile(html)(data);
};

export default compileHbs;

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const R = require('ramda');
const fastmatter = require('fastmatter');
const T = require('./questionnaire-types');
const Future = require('fluture');

const readdir = R.curryN(2, fs.readdir);

const constructDemo = R.curry((base, demo) => ({
  name: demo,
  path: path.resolve(base, demo)
}));

const parseDemos = basePath =>
  Future.node(done => fs.readdir(path.resolve(basePath, 'demos'), done))
    .map(R.map(constructDemo(basePath)));

const toInfo = fm => ({
  name: fm.attributes.name,
  descr: fm.body
});

const parseReadme = basePath =>
  Future.node(done => fs.readFile(path.resolve(basePath, 'readme.md'), 'utf8', done))
    .map(fastmatter).map(toInfo);

module.exports = {
  generateDirInfo: reqPath =>
    Future.node(readdir(reqPath))
    .chain(R.cond([
      [R.compose(R.not, R.contains('demos')), () => parseReadme(reqPath)],
      [R.T, () => Future.parallel(2, [parseDemos(reqPath), parseReadme(reqPath)]).map(R.mergeAll)]
    ])),

  runTheApiServer: configPath => {
    var apiSrv = cp.spawn('./index.js', ['-c', configPath]);
    apiSrv.stdout.on('data', data => console.log('' + data));
    apiSrv.stderr.on('data', data => console.log('' + data));
    apiSrv.on('close', code => console.log('child process exited with code ' + code));
    return 'Running the server ...';
  },

  /**
   * Saves the output JSON to the file.
   * Logs the message to the console.
   * @param  {T.Questionnaire} questionnaire
   * @return {T.Questionnaire|null}
   */
  saveOutputIfApproved: (questionnaire) => {
    if (questionnaire.configConfirm.confirmConfig) {
      fs.writeFileSync(
        path.resolve(__dirname, questionnaire.lobby.configPath),
        JSON.stringify(questionnaire.config, null, 2),
        { encoding: 'utf8' }
      );
      console.log('JSON file has been successfully saved to ' + questionnaire.lobby.configPath);
      return questionnaire;
    } else {
      return null;
    }
  }
}
import fs from 'fs';
import path from 'path';
import process from 'process';
import { all, promisify, reject } from 'bluebird';
import {
    T,
    append,
    cond,
    dropWhile,
    equals,
    flatten,
    join,
    juxt,
    last,
    map,
    merge,
    pick,
    prop,
    replace,
    split,
    startsWith
} from 'ramda';
import semver from 'semver';
import superagent from 'superagent';
import inquirer from 'inquirer';
import { emitSuccess } from './input';

const request = superagent.agent();
const createFolder = promisify(fs.mkdir);
const createFile = promisify(fs.writeFile);

/**
 * Formats a formatted String
 *
 * @param {String} source
 * @return {String}
 */
const format = replace(/\n {8}/g, '\n')
    & dropWhile(equals('\n'))
    & append('\n')
    & join('');

/**
 * Returns the default name for the project according to the OS
 *
 * @param {String} directory
 * @return {String}
 */
const getDefaultName = cond([
    [~startsWith('win32', process.platform), split('\\')],
    [T, split('/')]
]) & last;

/**
 * Generate the answers from the stdin.
 *
 * @return {Promise}
 */
function askQuestions() {
    return request.get('https://app.rung.com.br/api/categories')
        .then(prop('body') & map(({ name, alias: value }) => ({ name, value })))
        .catch(~[{ name: 'Miscellaneous', value: 'miscellaneous' }])
        .then(categories => [
            { name: 'name', message: 'Project name', default: getDefaultName(process.cwd()) },
            { name: 'version', message: 'Version', default: '1.0.0', validate: semver.valid & Boolean },
            { name: 'title', message: 'Title', default: 'Untitled' },
            { name: 'description', message: 'Description' },
            { name: 'category', type: 'list', message: 'Category', default: 'miscellaneous', choices: categories },
            { name: 'license', message: 'license', default: 'MIT' }
        ])
        .then(inquirer.createPromptModule());
}

/**
 * Creates the folder for the boilerplate based on package name. If the folder
 * already exists, throw an error
 * Queria estar morta
 *
 * @param {Object} answers
 * @return {Promise}
 */
function createBoilerplateFolder(answers) {
    return createFolder(answers.name)
        .tap(createFolder(`${answers.name}/info`))
        .catch(~reject(new Error(`Unable to create folder ${answers.name}`)))
        .return(answers);
}

/**
 * Returns an object in the format { filename :: String, content :: String }
 * containing meta-informations about the file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getPackageMetaFile(answers) {
    const packageFields = ['name', 'version', 'license', 'category'];
    const packageObject = merge(pick(packageFields, answers),
        { dependencies: { 'rung-cli': '1.0.0' } });

    return {
        filename: path.join(answers.name, 'package.json'),
        content: JSON.stringify(packageObject, null, 2)
    };
}

/**
 * Content about README.md file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getReadMeMetaFile(answers) {
    const content = format(`
        # Rung ─ ${answers.title}

        # Development

        - Use \`yarn\` to install the dependencies
        - Use \`rung run\` to start the CLI wizard
    `);

    return { filename: path.join(answers.name, 'README.md'), content };
}

/**
 * Content about info files
 *
 * @param {Object} answers
 * @return {Object}
 */
function getInfoFiles(answers) {
    const locales = ['en', 'es', 'pt_BR'];
    return locales
        | map(locale => ({ filename: path.join(answers.name, `info/${locale}.md`), content: '' }));
}

/**
 * Content about index.js file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getIndexFile(answers) {
    const content = format(`
        import { create } from 'rung-sdk';
        import { String as Text } from 'rung-cli/dist/types';

        function render(name) {
            return <b>{ _('Hello {{name}}', { name }) }</b>;
        }

        function main(context) {
            const { name } = context.params;
            return {
                alerts: [{
                    title: _('Welcome'),
                    content: render(name),
                    resources: []
                }]
            };
        }

        const params = {
            name: {
                description: _('What is your name?'),
                type: Text
            }
        };

        export default create(main, {
            params,
            primaryKey: true,
            title: _(${JSON.stringify(answers.title)}),
            description: _(${JSON.stringify(answers.description)}),
            preview: render('Trixie')
        });
    `);

    return { filename: path.join(answers.name, 'index.js'), content };
}

/**
 * Creates a boilerplate project
 *
 * @return {Promise}
 */
export default function boilerplate() {
    return askQuestions()
        .then(createBoilerplateFolder)
        .then(juxt([getPackageMetaFile, getReadMeMetaFile, getIndexFile, getInfoFiles]))
        .then(flatten)
        .then(map(({ filename, content }) => createFile(filename, content)) & all)
        .then(~emitSuccess('project generated'));
}

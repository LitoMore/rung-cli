import process from 'process';
import fs from 'fs';
import { promisify, props, resolve } from 'bluebird';
import {
    T,
    __,
    assoc,
    concat,
    cond,
    contains,
    curry,
    filter as filterWhere,
    has,
    keys,
    map,
    mapObjIndexed,
    merge,
    pathEq,
    reduce,
    toPairs,
    when
} from 'ramda';
import { cyan, green, red, yellow } from 'colors/safe';
import { createPromptModule } from 'inquirer';
import { validator, filter } from './types';
import getAutocompleteSources, { compileClosure } from './autocomplete';

/**
 * Emits an info message to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitInfo = concat(' ℹ Info: ') & cyan & console.log & resolve;

/**
 * Emits a warning to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitWarning = concat(' ⚠ Warning: ') & yellow & console.log & resolve;

/**
 * Emits an error to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitError = concat(' ✗ Error: ') & red & console.log & resolve;

/**
 * Emits a success message
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitSuccess = concat(' ✔ Success: ') & green & console.log & resolve;

/**
 * Renames the keys of an object
 *
 * @sig {a: b} -> {a: *} -> {b: *}
 */
const renameKeys = curry((keysMap, obj) => reduce((acc, key) =>
    assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj)));

const objectToChoices = toPairs & map(([value, name]) => ({ name, value }));

export const components = {
    Calendar: ~{
        type: 'datetime',
        format: ['m', '/', 'd', '/', 'yy'],
        filter: filter.Calendar },
    Char: ({ length }) => ({ filter: filter.Char(length) }),
    Checkbox: ~{ type: 'confirm' },
    Color: ~{
        type: 'chalk-pipe',
        validate: validator.Color },
    DoubleRange: ({ from, to }) => ({
        filter: filter.Double,
        validate: validator.Range(from, to) }),
    DateTime: ~{ type: 'datetime' },
    Double: ~{ validate: validator.Double, filter: filter.Double },
    Email: ~{ validate: validator.Email },
    Integer: ~{ validate: validator.Integer, filter: filter.Integer },
    IntegerRange: ({ from, to }) => ({
        filter: filter.Integer,
        validate: validator.Range(from, to) }),
    IntegerMultiRange: ({ from, to }) => ({
        filter: filter.IntegerMultiRange,
        validate: validator.IntegerMultiRange(from, to) }),
    Natural: ~{ validate: validator.Natural, filter: filter.Integer },
    OneOf: ({ values }) => ({
        type: 'list',
        choices: values,
        validate: validator.OneOf(values) }),
    String: ~{ type: 'input' },
    Url: ~{ validate: validator.Url },
    Money: ~{ validate: validator.Money, filter: filter.Money },
    SelectBox: ({ values }) => ({
        type: 'list',
        choices: objectToChoices(values) }),
    MultiSelectBox: ({ values }) => ({
        type: 'checkbox',
        choices: objectToChoices(values) }),
    File: ~{ type: 'filePath', basePath: process.cwd() }
};

/**
 * Custom autocomplete component
 *
 * @param {String} name
 * @param {String} source
 * @return {Function}
 */
const getAutocompleteComponent = (name, source) => {
    if (!source) {
        throw new Error(`aren't you missing 'autocomplete/${name}.js'?`);
    }

    return ~{ type: 'autocomplete', source: compileClosure(name, source) };
};

/**
 * Converts a Rung CLI question object to an Inquirer question object
 *
 * @author Marcelo Haskell Camargo
 * @param {String[]} sources
 * @param {String} name
 * @param {Object} config
 * @return {Object}
 */
const toInquirerQuestion = curry((sources, [name, config]) => {
    const component = components
        | cond([
            [~(config.type.name === 'AutoComplete'), ~getAutocompleteComponent(name, sources[name])],
            [has(config.type.name), _[config.type.name]],
            [T, _.String]
        ]);

    return merge(config
        | renameKeys({ description: 'message' })
        | merge(__, { name }), component(config.type));
});

const readFile = promisify(fs.readFile);

/**
 * Opens the provided files and returns them as node buffers
 *
 * @param {String[]} fields
 * @param {Object} answers
 * @return {Promise}
 */
const openFiles = fields =>
    mapObjIndexed((value, param) => value
        | when(~contains(param, fields), concat(process.cwd() + '/') & readFile))
    & props;

/**
 * Returns the pure JS values from received questions that will be answered
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} questions
 * @return {Promise} answers for the questions by key
 */
export function ask(questions) {
    const DatePickerPrompt = require('inquirer-datepicker-prompt');
    const ChalkPipe = require('inquirer-chalk-pipe');
    const AutocompletePrompt = require('inquirer-autocomplete-prompt');
    const FilePath = require('inquirer-file-path');
    const fileFields = questions
        | filterWhere(pathEq(['type', 'name'], 'File'))
        | keys;

    const prompt = createPromptModule();
    prompt.registerPrompt('datetime', DatePickerPrompt);
    prompt.registerPrompt('chalk-pipe', ChalkPipe);
    prompt.registerPrompt('autocomplete', AutocompletePrompt);
    prompt.registerPrompt('filePath', FilePath);
    return getAutocompleteSources()
        .then(autocompleteSources => questions
            | toPairs
            | map(toInquirerQuestion(autocompleteSources))
            | prompt)
        .then(openFiles(fileFields));
}

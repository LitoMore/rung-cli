# Rung CLI

[![NPM](https://nodei.co/npm/rung-cli.png)](https://npmjs.org/package/rung-cli)

[![Version](https://img.shields.io/npm/v/rung-cli.svg)](https://www.npmjs.com/package/rung-cli)
[![Build Status](https://travis-ci.org/rung-tools/rung-cli.svg?branch=master)](https://travis-ci.org/rung-tools/rung-cli)
[![Code Climate](https://codeclimate.com/github/rung-tools/rung-cli/badges/gpa.svg)](https://codeclimate.com/github/rung-tools/rung-cli)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/rung-tools/rung-cli/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/rung-tools/rung-cli/?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/rung-tools/rung-cli/badge.svg)](https://snyk.io/test/github/rung-tools/rung-cli)
[![Codecov](https://codecov.io/gh/rung-tools/rung-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/rung-tools/rung-cli)
[![Downloads](https://img.shields.io/npm/dt/rung-cli.svg)](https://www.npmjs.com/package/rung-cli)

Command line tools for Rung

## Installation

`sudo npm install -g rung-cli`

This will make the command `rung` available globally.

## Documentation

You can checkout the last docs in [this link](https://developers.rung.com.br/docs/)!

## Features

- Create blank extensions
- Generate `.rung` packages
- Run extensions locally in CLI mode
- Publish extensions to Rung Store (public and private)
- Generate boilerplate code for extension
- Generate README.md file to publish
- Test autocomplete directly in the terminal
- Hot reloading and live development

## Usage

`rung [build|run|publish|boilerplate|readme|db]`

### Commands


| Command       | Description |
|---------------|-------------|
| `build`       | Generate a .rung package |
| `run`         | Execute the current extension |
| `publish`     | Publish extension to store |
| `boilerplate` | Generate boilerplate code for the extension |
| `readme`      | Generate the README.md file to publish |
| `db read`     | Read from extension database |
| `db clear`    | Drop extension database |

### Options

| Option           | Description |
|------------------|-------------|
| `-o`, `--output` | Where to save the built package |
| `--version`      | Displays versions |
| `--private`      | If set, extension is published for current user only |
| `--raw`          | Displays returned alerts outside a table |
| `--live`         | With `run`, starts hot compiling and preview on browser |

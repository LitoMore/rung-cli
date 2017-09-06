import fs from 'fs';
import prepend from 'prepend-file';
import Promise, { promisify } from 'bluebird';
import { expect } from 'chai';
import { split } from 'ramda';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import work, { keepCalm } from './salete';

const request = promisifyAgent(agent, Promise);
const createFolder = promisify(fs.mkdir);
const createFile = promisify(fs.writeFile);
const prependFile = promisify(prepend);

const npm = {
    runs: ['npm', 'install'],
    does: [keepCalm(5 * 60)]
};

const compile = {
    runs: ['node', '../dist/cli.js', 'build'],
    does: [keepCalm(30)]
};

const putSomeIcon = ~request.get('http://www.randomkittengenerator.com/cats/rotator.php')
    .then(({ body }) => createFile('icon.png', body));

export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should compile the generated boilerplate', () => {
        return work(npm)
            .then(() => {
                void expect('node_modules').to.be.a.directory().and.not.empty;
                return work(compile);
            })
            .then(output => {
                const [warning, success] = output | split('\n');
                expect(warning).to.contain('compiling extension without providing an icon.png file');
                expect(success).to.contain('Rung extension compilation');
                expect('salete-hello-world.rung').to.be.a.file();
            });
    }).timeout(keepCalm(90));

    it('should link locales and icon to compilation', () => {
        return createFolder('locales')
            .then(() => createFile('locales/pt_BR.json', JSON.stringify({
                'Very Cool Project': 'Projeto Muito Legal'
            })))
            .tap(putSomeIcon)
            .then(~work(compile))
            .then(output => {
                expect(output).to.not.contain('compiling extension without providing an icon.png file');
                expect(output).to.contain('Rung extension compilation');
                expect('.meta').to.be.a.file().with.json.using.schema({
                    type: 'object',
                    required: ['title', 'description', 'preview', 'params'],
                    properties: {
                        title: {
                            type: 'object',
                            required: ['default', 'pt_BR'],
                            default: {
                                type: 'string'
                            },
                            pt_BR: {
                                type: 'string'
                            }
                        }
                    }
                });
            });
    }).timeout(keepCalm(30));

    after(~process.chdir('..'));
};
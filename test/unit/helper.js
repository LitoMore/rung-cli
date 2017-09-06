import { spawn } from 'child_process';
import { promisifyStream } from '../salete/salete';

export function createCustomStream(env, args = [], cmd = 'dist/cli.js') {
    const task = spawn('node', [cmd, ...args], { stdio: 'pipe', env });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        after: promisifyStream(task.stdin.on.bind(task.stdin, 'close')),
        close: ~task.kill('SIGTERM'),
        process: ~task
    };
}

export function createStream(args = [], cmd = 'dist/cli.js') {
    return createCustomStream({}, args, cmd);
}
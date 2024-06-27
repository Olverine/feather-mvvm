/**
 * A pipe is used to display data a certain way.
 * In practice it is just a function that takes
 * a string input and returns a string output.
 * Pipes can be used for things like date 
 * formatting before showing it in the view.
 */

let pipes = new Map<string, {(input: string): string}>();

/**
 * Register a new pipe
 * @param name Name of the pipe (This is how the
 * view will refer to the pipe)
 * @param fn Pipe function. When data is bound
 * to a piped element, it will pass through the
 * pipe function and the return value will appear
 * in the view.
 */
export function registerPipe(name: string, fn: {(input: string): string}): void {
    pipes.set(name, fn);
}

/**
 * Pass data through a pipe.
 * @param name Name of the pipe
 * @param str Data to pass through the pipe
 * @returns The return value of the pipe function
 */
export function pipe(name: string, str: string): string {
    return pipes.get(name).call(undefined, str);
}
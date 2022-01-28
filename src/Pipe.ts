let pipes = new Map<string, {(input: string): string}>();

export function registerPipe(name: string, fn: {(input: string): string}): void {
    pipes.set(name, fn);
}

export function pipe(name: string, str: string): string {
    return pipes.get(name).call(undefined, str);
}
export type TaskResponse = {
    id: string,
    status: 'DONE' | 'ERROR',
    body?: string
};

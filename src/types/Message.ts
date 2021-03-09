export type Message = {
    status: 'TASK_DONE' | 'ERROR',
    body?: string,
    id: string,
};

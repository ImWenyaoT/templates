export type ReturnTypeOfRepository<T extends (...args: never[]) => unknown> = ReturnType<T>

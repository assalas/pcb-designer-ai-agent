import { LRUCache } from 'lru-cache';
export type Listener = (...as: any[]) => void;
export type INodeStyleCallBack<Success> = (err: Error | null, result?: Success) => void;
export interface ResultBase {
    /**
     * Returns all keys in the cache.
     */
    keys: () => string[];
    /**
     * Clear the cache.
     */
    reset: () => void;
    /**
     * Delete an item given the parameters.
     */
    del: <T1, T2, T3, T4, T5, T6>(a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => void;
    on(event: 'hit', handler: Listener): void;
    on(event: 'miss', handler: Listener): void;
    on(event: 'queue', handler: Listener): void;
}
export interface IHashingFunction0 {
    (): string;
}
export interface IHashingFunction1<T1> {
    (a1: T1): string;
}
export interface IHashingFunction2<T1, T2> {
    (a1: T1, a2: T2): string;
}
export interface IHashingFunction3<T1, T2, T3> {
    (a1: T1, a2: T2, a3: T3): string;
}
export interface IHashingFunction4<T1, T2, T3, T4> {
    (a1: T1, a2: T2, a3: T3, a4: T4): string;
}
export interface IHashingFunction5<T1, T2, T3, T4, T5> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): string;
}
export interface IHashingFunction6<T1, T2, T3, T4, T5, T6> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): string;
}
export interface IHashingFunctionPlus {
    (...rest: any[]): string;
}
export interface IBypassFunction0 {
    (): boolean;
}
export interface IBypassFunction1<T1> {
    (a1: T1): boolean;
}
export interface IBypassFunction2<T1, T2> {
    (a1: T1, a2: T2): boolean;
}
export interface IBypassFunction3<T1, T2, T3> {
    (a1: T1, a2: T2, a3: T3): boolean;
}
export interface IBypassFunction4<T1, T2, T3, T4> {
    (a1: T1, a2: T2, a3: T3, a4: T4): boolean;
}
export interface IBypassFunction5<T1, T2, T3, T4, T5> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): boolean;
}
export interface IBypassFunction6<T1, T2, T3, T4, T5, T6> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): boolean;
}
export interface IBypassFunctionPlus {
    (...rest: any[]): boolean;
}
export interface ITTLFunction0<TResult> {
    (res: TResult): number;
}
export interface ITTLFunction1<T1, TResult> {
    (a1: T1, res: TResult): number;
}
export interface ITTLFunction2<T1, T2, TResult> {
    (a1: T1, a2: T2, res: TResult): number;
}
export interface ITTLFunction3<T1, T2, T3, TResult> {
    (a1: T1, a2: T2, a3: T3, res: TResult): number;
}
export interface ITTLFunction4<T1, T2, T3, T4, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, res: TResult): number;
}
export interface ITTLFunction5<T1, T2, T3, T4, T5, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, res: TResult): number;
}
export interface ITTLFunction6<T1, T2, T3, T4, T5, T6, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, res: TResult): number;
}
export interface ITTLFunctionPlus {
    (...rest: any[]): number;
}
export type IParamsBase0<TResult> = IParamsBaseCommons & {
    hash: IHashingFunction0;
    bypass?: IBypassFunction0;
    itemTTL?: ITTLFunction0<TResult>;
};
export type IParamsBase1<T1, TResult> = IParamsBaseCommons & {
    hash: IHashingFunction1<T1>;
    bypass?: IBypassFunction1<T1>;
    itemTTL?: ITTLFunction1<T1, TResult>;
};
export type IParamsBase2<T1, T2, TResult> = IParamsBaseCommons & {
    hash: IHashingFunction2<T1, T2>;
    bypass?: IBypassFunction2<T1, T2>;
    itemTTL?: ITTLFunction2<T1, T2, TResult>;
};
export type IParamsBase3<T1, T2, T3, TResult> = IParamsBaseCommons & {
    hash: IHashingFunction3<T1, T2, T3>;
    bypass?: IBypassFunction3<T1, T2, T3>;
    itemTTL?: ITTLFunction3<T1, T2, T3, TResult>;
};
export type IParamsBase4<T1, T2, T3, T4, TResult> = IParamsBaseCommons & {
    hash: IHashingFunction4<T1, T2, T3, T4>;
    bypass?: IBypassFunction4<T1, T2, T3, T4>;
    itemTTL?: ITTLFunction4<T1, T2, T3, T4, TResult>;
};
export type IParamsBase5<T1, T2, T3, T4, T5, TResult> = IParamsBaseCommons & {
    hash: IHashingFunction5<T1, T2, T3, T4, T5>;
    bypass?: IBypassFunction5<T1, T2, T3, T4, T5>;
    itemTTL?: ITTLFunction5<T1, T2, T3, T4, T5, TResult>;
};
export type IParamsBase6<T1, T2, T3, T4, T5, T6, TResult> = IParamsBaseCommons & {
    /**
     * A function to generate the key of the cache.
     */
    hash: IHashingFunction6<T1, T2, T3, T4, T5, T6>;
    /**
     * Return true if the result should not be retrieved from the cache.
     */
    bypass?: IBypassFunction6<T1, T2, T3, T4, T5, T6>;
    /**
     * An optional function to indicate the ttl of an specific item.
     */
    itemTTL?: ITTLFunction6<T1, T2, T3, T4, T5, T6, TResult>;
};
export type IParamsBasePlus = IParamsBaseCommons & {
    hash: IHashingFunctionPlus;
    bypass?: IBypassFunctionPlus;
    itemTTL?: ITTLFunctionPlus;
};
type IParamsBaseCommons = LRUCache.Options<string, any, unknown> & {
    /**
     * Indicates if the resource should be freezed.
     */
    freeze?: boolean;
    /**
     * Indicates if the resource should be cloned before is returned.
     */
    clone?: boolean;
    /**
     * Disable the cache and executes the load logic directly.
     */
    disable?: boolean;
    /**
     * Do not queue requests if initial call is more than `queueTTL` milliseconds old.
     * Instead, invoke `load` again and create a new queue.
     * Defaults to 1000ms.
     */
    queueTTL?: number;
};
export {};
//# sourceMappingURL=util.d.ts.map
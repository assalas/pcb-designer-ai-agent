import { syncMemoizer } from './sync';
import { INodeStyleCallBack as CB, ResultBase, IParamsBase0, IParamsBase1, IParamsBase2, IParamsBase3, IParamsBase4, IParamsBase5, IParamsBase6 } from './util';
export interface IMemoized<T1, T2, T3, T4, T5, T6, TResult> extends ResultBase {
    (cb: CB<TResult>): void;
    (a1: T1, cb: CB<TResult>): void;
    (a1: T1, a2: T2, cb: CB<TResult>): void;
    (a1: T1, a2: T2, a3: T3, cb: CB<TResult>): void;
    (a1: T1, a2: T2, a3: T3, a4: T4, cb: CB<TResult>): void;
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, cb: CB<TResult>): void;
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, cb: CB<TResult>): void;
}
interface IMemoizableFunction0<TResult> {
    (cb: CB<TResult>): void;
}
interface IMemoizableFunction1<T1, TResult> {
    (a1: T1, cb: CB<TResult>): void;
}
interface IMemoizableFunction2<T1, T2, TResult> {
    (a1: T1, a2: T2, cb: CB<TResult>): void;
}
interface IMemoizableFunction3<T1, T2, T3, TResult> {
    (a1: T1, a2: T2, a3: T3, cb: CB<TResult>): void;
}
interface IMemoizableFunction4<T1, T2, T3, T4, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, cb: CB<TResult>): void;
}
interface IMemoizableFunction5<T1, T2, T3, T4, T5, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, cb: CB<TResult>): void;
}
interface IMemoizableFunction6<T1, T2, T3, T4, T5, T6, TResult> {
    (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, cb: CB<TResult>): void;
}
type AsyncParams0<TResult> = IParamsBase0<TResult> & {
    load: IMemoizableFunction0<TResult>;
};
type AsyncParams1<T1, TResult> = IParamsBase1<T1, TResult> & {
    load: IMemoizableFunction1<T1, TResult>;
};
type AsyncParams2<T1, T2, TResult> = IParamsBase2<T1, T2, TResult> & {
    load: IMemoizableFunction2<T1, T2, TResult>;
};
type AsyncParams3<T1, T2, T3, TResult> = IParamsBase3<T1, T2, T3, TResult> & {
    load: IMemoizableFunction3<T1, T2, T3, TResult>;
};
type AsyncParams4<T1, T2, T3, T4, TResult> = IParamsBase4<T1, T2, T3, T4, TResult> & {
    load: IMemoizableFunction4<T1, T2, T3, T4, TResult>;
};
type AsyncParams5<T1, T2, T3, T4, T5, TResult> = IParamsBase5<T1, T2, T3, T4, T5, TResult> & {
    load: IMemoizableFunction5<T1, T2, T3, T4, T5, TResult>;
};
type AsyncParams6<T1, T2, T3, T4, T5, T6, TResult> = IParamsBase6<T1, T2, T3, T4, T5, T6, TResult> & {
    /**
     * The function that loads the resource when is not in the cache.
     */
    load: IMemoizableFunction6<T1, T2, T3, T4, T5, T6, TResult>;
};
declare function asyncMemoizer<TResult>(options: AsyncParams0<TResult>): IMemoized<unknown, unknown, unknown, unknown, unknown, unknown, TResult>;
declare function asyncMemoizer<T1, TResult>(options: AsyncParams1<T1, TResult>): IMemoized<T1, unknown, unknown, unknown, unknown, unknown, TResult>;
declare function asyncMemoizer<T1, T2, TResult>(options: AsyncParams2<T1, T2, TResult>): IMemoized<T1, T2, unknown, unknown, unknown, unknown, TResult>;
declare function asyncMemoizer<T1, T2, T3, TResult>(options: AsyncParams3<T1, T2, T3, TResult>): IMemoized<T1, T2, T3, unknown, unknown, unknown, TResult>;
declare function asyncMemoizer<T1, T2, T3, T4, TResult>(options: AsyncParams4<T1, T2, T3, T4, TResult>): IMemoized<T1, T2, T3, T4, unknown, unknown, TResult>;
declare function asyncMemoizer<T1, T2, T3, T4, T5, TResult>(options: AsyncParams5<T1, T2, T3, T4, T5, TResult>): IMemoized<T1, T2, T3, T4, T5, unknown, TResult>;
declare function asyncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(options: AsyncParams6<T1, T2, T3, T4, T5, T6, TResult>): IMemoized<T1, T2, T3, T4, T5, T6, TResult>;
declare namespace asyncMemoizer {
    var sync: typeof syncMemoizer;
}
export { asyncMemoizer };
//# sourceMappingURL=async.d.ts.map
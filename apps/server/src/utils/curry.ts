/* eslint-disable @typescript-eslint/no-explicit-any */

// https://medium.com/@patrick.trasborg/creating-a-type-safe-curry-function-with-typescript-3eeb29b5457d
type Fn = (...args: any[]) => any;

type RequiredFirstParam<Func extends Fn> =
  Parameters<Func> extends [infer Head, ...infer Tail]
    ? [Head, ...Partial<Tail>]
    : [];

type RemainingParameters<
  AppliedParams extends any[],
  ExpectedParams extends any[],
> = AppliedParams extends [any, ...infer ATail]
  ? ExpectedParams extends [any, ...infer ETail]
    ? RemainingParameters<ATail, ETail>
    : []
  : ExpectedParams;

type CurriedFunction<Func extends Fn> = <
  AppliedParams extends RequiredFirstParam<Func>,
>(
  ...args: AppliedParams
) => RemainingParameters<AppliedParams, Parameters<Func>> extends [
  any,
  ...any[],
]
  ? CurriedFunction<
      (
        ...args: RemainingParameters<AppliedParams, Parameters<Func>>
      ) => ReturnType<Func>
    >
  : ReturnType<Func>;

/**
 * Enable partial aplications of functions in a type safe way.
 *
 * See currying in functional programming for reference
 */
export const curry = <Func extends Fn>(
  f: Func,
  ...args: Partial<Parameters<Func>>
): CurriedFunction<Func> => {
  const curriedFunc = (...nextArgs: RequiredFirstParam<Func>) => {
    const allArgs = [...args, ...nextArgs];

    if (allArgs.length >= f.length) {
      return f(...args, ...nextArgs);
    } else {
      return curry(f, ...(allArgs as Parameters<Func>));
    }
  };

  return curriedFunc;
};

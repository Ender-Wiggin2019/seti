import { createContext, type ReactNode, useContext } from 'react';

export interface IGameLayoutRuntimeOptions {
  showSolarSystemSpaceConfig: boolean;
  allowMoveAnyProbe: boolean;
}

const DEFAULT_OPTIONS: IGameLayoutRuntimeOptions = {
  showSolarSystemSpaceConfig: false,
  allowMoveAnyProbe: false,
};

const RuntimeOptionsContext =
  createContext<IGameLayoutRuntimeOptions>(DEFAULT_OPTIONS);

export function GameLayoutRuntimeOptionsProvider({
  value,
  children,
}: {
  value: IGameLayoutRuntimeOptions;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <RuntimeOptionsContext.Provider value={value}>
      {children}
    </RuntimeOptionsContext.Provider>
  );
}

export function useGameLayoutRuntimeOptions(): IGameLayoutRuntimeOptions {
  return useContext(RuntimeOptionsContext);
}

declare global {
  const jest: {
    fn: () => { mockImplementation: (callback: any) => any };
    requireActual: (moduleName: string) => any;
    mock: (moduleName: string, factory?: () => any) => void;
    clearAllMocks: () => void;
    setTimeout: (timeout: number) => void;
    Mock: any;
  };

  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect(value: any): {
    toBeTruthy(): void;
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeInTheDocument(): void;
  };

  namespace NodeJS {
    interface Global {
      jest: typeof jest;
      describe: typeof describe;
      beforeEach: typeof beforeEach;
      afterEach: typeof afterEach;
      it: typeof it;
      expect: typeof expect;
    }
  }
}

export {};

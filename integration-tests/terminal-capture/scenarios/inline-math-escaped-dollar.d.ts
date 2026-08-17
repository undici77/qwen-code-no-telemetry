declare const _default: {
  name: string;
  spawn: string[];
  terminal: {
    title: string;
    cwd: string;
    cols: number;
    rows: number;
  };
  flow: (
    | {
        type: string;
        capture: string;
        sleep?: undefined;
      }
    | {
        sleep: number;
        capture: string;
        type?: undefined;
      }
  )[];
  gif: false;
};
export default _default;

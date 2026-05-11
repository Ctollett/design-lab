declare module "curtainsjs" {
  interface CurtainsOptions {
    container: HTMLElement;
    watchScroll?: boolean;
    pixelRatio?: number;
  }

  interface PlaneUniform {
    name: string;
    type: string;
    value: number | number[];
  }

  interface PlaneOptions {
    vertexShader?: string;
    fragmentShader?: string;
    uniforms?: Record<string, PlaneUniform>;
    widthSegments?: number;
    heightSegments?: number;
  }

  export class Curtains {
    constructor(options: CurtainsOptions);
    updateScrollValues(x: number, y: number): void;
    dispose(): void;
  }

  export class Plane {
    constructor(curtains: Curtains, element: HTMLElement, options?: PlaneOptions);
    uniforms: Record<string, PlaneUniform>;
    remove(): void;
  }
}

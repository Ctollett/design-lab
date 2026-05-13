declare module "troika-three-text" {
  import { Mesh } from "three";

  export class Text extends Mesh {
    text: string;
    font: string;
    fontSize: number;
    color: number | string;
    letterSpacing: number;
    fontStyle: "normal" | "italic";
    fontWeight: number | string;
    anchorX: "left" | "center" | "right" | number | string;
    anchorY: "top" | "middle" | "bottom" | "baseline" | number | string;
    fontFeatureSettings: string;
    sync(callback?: () => void): void;
    dispose(): void;
  }
}

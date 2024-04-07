import { XJoinAttributes } from "./components/xjoin.js";
import { YJoinAttributes } from "./components/yjoin.js";

export interface CharAttributes {
    fg: number;
    bg: number;
    underline: boolean;
    doubleHeight: boolean;
    doubleWidth: boolean;
    noBlink: boolean;
    invert: boolean;
}
export type Align = 'start' | 'middle' | 'end';
export interface MinitelObjectAttributes extends Partial<CharAttributes> {
    fillChar: string;
    widthAlign: Align;
    heightAlign: Align;
    width: number | null;
    height: number | null;
    wrap: 'clip' | 'word-wrap' | 'word-break';
}
export interface RenderLinesAttributes extends MinitelObjectAttributes {
    forcedIndent?: number;
}

type MiniProps<T> = Partial<T & { children: React.ReactNode | React.ReactNode[] }>;
type MiniElementsWithProps = {
    xjoin: MiniProps<XJoinAttributes>;
    yjoin: MiniProps<YJoinAttributes>;
    para: MiniProps<MinitelObjectAttributes>;
    cont: MiniProps<MinitelObjectAttributes>;
};

declare module "react/jsx-runtime" {
    namespace JSX {
        interface IntrinsicElements extends MiniElementsWithProps {}
    }
}

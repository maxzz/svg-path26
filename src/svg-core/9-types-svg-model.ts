export type Point = { x: number; y: number; };
export type SizeWH = { width: number; height: number; };
export type Bounds = { xmin: number; ymin: number; xmax: number; ymax: number; };
export type ViewBox = readonly [x: number, y: number, width: number, height: number];

export type SvgSegmentSummary = {
    index: number;
    command: string;
    values: number[];
    target: Point;
};

export type SvgCanvasPoint = {
    id: string;
    segmentIndex: number;
    kind: "target" | "control";
    controlIndex: number;
    x: number;
    y: number;
    movable: boolean;
    relations: Point[];
};

export type SvgCanvasLine = {
    from: Point;
    to: Point;
};

export type SvgCanvasGeometry = {
    targets: SvgCanvasPoint[];
    controls: SvgCanvasPoint[];
    relationLines: SvgCanvasLine[];
    standaloneBySegment: string[];
};

export type SvgSegment = {
    command: string;
    values: number[];
};

export type AbsoluteSegment = {
    index: number;
    segment: SvgSegment;
    command: string;
    start: Point;
    end: Point;
    values: number[];
    reflectedCubicControl: Point;
    reflectedQuadraticControl: Point;
};

import { parseSvgPath } from "./parser";

export type SvgSegmentSummary = {
    index: number;
    command: string;
    values: number[];
    target: Point;
};

type SvgSegment = {
    command: string;
    values: number[];
};

export class SvgPathModel {
    readonly segments: SvgSegment[];

    constructor(path: string) {
        this.segments = parseSvgPath(path).map(([command, ...values]) => ({
            command,
            values: values.map((it) => Number.parseFloat(it)),
        }));
        this.validateFirstCommand();
    }

    private validateFirstCommand() {
        if (!this.segments.length) return;
        const first = upper(this.segments[0].command);
        if (first !== "M") {
            throw new Error("Path must start with moveto command (M or m)");
        }
    }

    clone(): SvgPathModel {
        return new SvgPathModel(this.toString(8, false));
    }

    toString(decimals = 3, minify = false): string {
        const chunked = this.segments.map((segment) => {
            const formatted = segment.values.map((v) => formatNumber(v, decimals, minify));
            if (!formatted.length) return segment.command;
            return [segment.command, ...formatted].join(" ");
        });

        const joined = chunked.join(minify ? "" : " ");
        if (!minify) return joined;

        return joined
            .replace(/ -/g, "-")
            .replace(/([a-zA-Z]) /g, "$1")
            .replace(/(\.[0-9]+) (?=\.)/g, "$1");
    }

    getCommandCount(): number {
        return this.segments.length;
    }

    getTargetPoints(): Point[] {
        return this.getSummaries().map((it) => it.target);
    }

    getBounds(): Bounds {
        const targets = this.getTargetPoints();
        if (!targets.length) {
            return { xmin: 0, ymin: 0, xmax: 10, ymax: 10 };
        }

        return {
            xmin: Math.min(...targets.map((p) => p.x)),
            ymin: Math.min(...targets.map((p) => p.y)),
            xmax: Math.max(...targets.map((p) => p.x)),
            ymax: Math.max(...targets.map((p) => p.y)),
        };
    }

    getSummaries(): SvgSegmentSummary[] {
        const summaries: SvgSegmentSummary[] = [];
        let current: Point = { x: 0, y: 0 };
        let subpathStart: Point = { x: 0, y: 0 };

        this.segments.forEach((segment, index) => {
            const absolute = this.toAbsoluteSegment(segment, current, subpathStart);
            const cmd = upper(absolute.command);

            if (cmd === "M") {
                subpathStart = { ...absolute.target };
            }
            if (cmd === "Z") {
                current = { ...subpathStart };
            } else {
                current = { ...absolute.target };
            }

            summaries.push({
                index,
                command: segment.command,
                values: [...segment.values],
                target: { ...absolute.target },
            });
        });

        return summaries;
    }

    setSegmentValue(segmentIndex: number, valueIndex: number, value: number) {
        const segment = this.segments[segmentIndex];
        if (!segment) return;
        if (valueIndex < 0 || valueIndex >= segment.values.length) return;
        if (!Number.isFinite(value)) return;
        segment.values[valueIndex] = value;
    }

    scale(scaleX: number, scaleY: number) {
        this.segments.forEach((segment) => {
            const cmd = upper(segment.command);
            switch (cmd) {
                case "M":
                case "L":
                case "T":
                case "C":
                case "S":
                case "Q":
                    for (let i = 0; i < segment.values.length; i += 2) {
                        segment.values[i] *= scaleX;
                        segment.values[i + 1] *= scaleY;
                    }
                    break;
                case "H":
                    segment.values[0] *= scaleX;
                    break;
                case "V":
                    segment.values[0] *= scaleY;
                    break;
                case "A":
                    segment.values[0] = Math.abs(segment.values[0] * scaleX);
                    segment.values[1] = Math.abs(segment.values[1] * scaleY);
                    segment.values[5] *= scaleX;
                    segment.values[6] *= scaleY;
                    break;
                case "Z":
                    break;
                default:
                    break;
            }
        });
    }

    translate(deltaX: number, deltaY: number) {
        this.segments.forEach((segment, index) => {
            const cmd = upper(segment.command);
            const relative = isRelative(segment.command);
            const forceTranslate = relative && index === 0 && cmd === "M";

            if (relative && !forceTranslate) return;

            switch (cmd) {
                case "M":
                case "L":
                case "T":
                case "C":
                case "S":
                case "Q":
                    for (let i = 0; i < segment.values.length; i += 2) {
                        segment.values[i] += deltaX;
                        segment.values[i + 1] += deltaY;
                    }
                    break;
                case "H":
                    segment.values[0] += deltaX;
                    break;
                case "V":
                    segment.values[0] += deltaY;
                    break;
                case "A":
                    segment.values[5] += deltaX;
                    segment.values[6] += deltaY;
                    break;
                case "Z":
                    break;
                default:
                    break;
            }
        });
    }

    setRelative(makeRelative: boolean) {
        let current: Point = { x: 0, y: 0 };
        let subpathStart: Point = { x: 0, y: 0 };

        this.segments.forEach((segment) => {
            const absSegment = this.toAbsoluteSegment(segment, current, subpathStart);
            const absCommand = upper(segment.command);

            if (makeRelative) {
                segment.command = segment.command.toLowerCase();
                segment.values = this.absoluteToRelativeValues(absCommand, absSegment.values, current);
            } else {
                segment.command = absCommand;
                segment.values = [...absSegment.values];
            }

            if (absCommand === "M") {
                subpathStart = { ...absSegment.target };
            }
            if (absCommand === "Z") {
                current = { ...subpathStart };
            } else {
                current = { ...absSegment.target };
            }
        });
    }

    private toAbsoluteSegment(segment: SvgSegment, current: Point, subpathStart: Point) {
        const cmd = upper(segment.command);
        const relative = isRelative(segment.command);
        const values = [...segment.values];

        const toAbsX = (x: number) => (relative ? current.x + x : x);
        const toAbsY = (y: number) => (relative ? current.y + y : y);

        if (cmd === "Z") {
            return {
                command: "Z",
                values: [],
                target: { ...subpathStart },
            };
        }

        if (cmd === "H") {
            const x = toAbsX(values[0]);
            return {
                command: "H",
                values: [x],
                target: { x, y: current.y },
            };
        }

        if (cmd === "V") {
            const y = toAbsY(values[0]);
            return {
                command: "V",
                values: [y],
                target: { x: current.x, y },
            };
        }

        if (cmd === "A") {
            const abs = [...values];
            abs[5] = toAbsX(values[5]);
            abs[6] = toAbsY(values[6]);
            return {
                command: "A",
                values: abs,
                target: { x: abs[5], y: abs[6] },
            };
        }

        const absValues = [...values];
        for (let i = 0; i < absValues.length; i += 2) {
            absValues[i] = toAbsX(absValues[i]);
            absValues[i + 1] = toAbsY(absValues[i + 1]);
        }
        const end = {
            x: absValues[absValues.length - 2],
            y: absValues[absValues.length - 1],
        };
        return {
            command: cmd,
            values: absValues,
            target: end,
        };
    }

    private absoluteToRelativeValues(command: string, absoluteValues: number[], current: Point): number[] {
        switch (command) {
            case "H":
                return [absoluteValues[0] - current.x];
            case "V":
                return [absoluteValues[0] - current.y];
            case "A":
                return [
                    absoluteValues[0],
                    absoluteValues[1],
                    absoluteValues[2],
                    absoluteValues[3],
                    absoluteValues[4],
                    absoluteValues[5] - current.x,
                    absoluteValues[6] - current.y,
                ];
            case "Z":
                return [];
            default: {
                const rel = [...absoluteValues];
                for (let i = 0; i < rel.length; i += 2) {
                    rel[i] -= current.x;
                    rel[i + 1] -= current.y;
                }
                return rel;
            }
        }
    }
}

type Point = { x: number; y: number; };

type Bounds = {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
};

function formatNumber(value: number, decimals: number, minify: boolean): string {
    let out = value
        .toFixed(decimals)
        .replace(/^(-?[0-9]*\.([0-9]*[1-9])?)0*$/, "$1")
        .replace(/\.$/, "");
    if (minify) {
        out = out.replace(/^(-?)0\./, "$1.");
    }
    return out;
}

function isRelative(command: string): boolean {
    return command === command.toLowerCase();
}

function upper(command: string): string {
    return command.toUpperCase();
}

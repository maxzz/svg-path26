import { parseSvgPath } from "./1-parser";
import type { AbsoluteSegment, Bounds, Point, SvgCanvasGeometry, SvgCanvasLine, SvgCanvasPoint, SvgSegment, SvgSegmentSummary, SvgSubPath, } from "@/svg-core/9-types-svg-model";

export class SvgPathModel {
    readonly segments: SvgSegment[];

    constructor(path: string) {
        this.segments = parseSvgPath(path).map(
            ([command, ...values]) => ({
                command,
                values: values.map((it) => Number.parseFloat(it)),
            })
        );
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
        return formatSegments(this.segments, decimals, minify);
    }

    getCommandCount(): number {
        return this.segments.length;
    }

    getTargetPoints(): Point[] {
        return this.computeAbsoluteSegments().map((it) => ({ ...it.end }));
    }

    getBounds(): Bounds {
        const geometry = this.getCanvasGeometry();
        const points = [
            ...geometry.targets.map((it) => ({ x: it.x, y: it.y })),
            ...geometry.controls.map((it) => ({ x: it.x, y: it.y })),
        ];

        if (!points.length) {
            return { xmin: 0, ymin: 0, xmax: 10, ymax: 10 };
        }

        return {
            xmin: Math.min(...points.map((p) => p.x)),
            ymin: Math.min(...points.map((p) => p.y)),
            xmax: Math.max(...points.map((p) => p.x)),
            ymax: Math.max(...points.map((p) => p.y)),
        };
    }

    getSummaries(): SvgSegmentSummary[] {
        return this.computeAbsoluteSegments().map(
            (item) => ({
                index: item.index,
                command: item.segment.command,
                values: [...item.segment.values],
                target: { ...item.end },
            })
        );
    }

    getSubPaths(decimals = 3, minify = false): SvgSubPath[] {
        if (!this.segments.length) {
            return [];
        }

        const absoluteSegments = this.computeAbsoluteSegments();
        const subPaths: SvgSubPath[] = [];
        let startIndex = absoluteSegments[0]?.index ?? 0;
        let currentSegments: SvgSegment[] = [];

        absoluteSegments.forEach(
            (segmentData, index) => {
                const startsNewSubpath = index > 0 && segmentData.command === "M";
                if (startsNewSubpath) {
                    const lastIndex = absoluteSegments[index - 1]?.index ?? startIndex;
                    subPaths.push({
                        index: subPaths.length,
                        startIndex,
                        endIndex: lastIndex,
                        path: formatSegments(currentSegments, decimals, minify),
                    });
                    startIndex = segmentData.index;
                    currentSegments = [];
                }

                currentSegments.push({
                    command: segmentData.command,
                    values: segmentData.command === "Z" ? [] : [...segmentData.values],
                });
            }
        );

        if (currentSegments.length) {
            subPaths.push({
                index: subPaths.length,
                startIndex,
                endIndex: absoluteSegments[absoluteSegments.length - 1]?.index ?? startIndex,
                path: formatSegments(currentSegments, decimals, minify),
            });
        }

        return subPaths;
    }

    get subPaths(): SvgSubPath[] {
        return this.getSubPaths();
    }

    getCanvasGeometry(): SvgCanvasGeometry {
        return this.buildCanvasGeometry(this.computeAbsoluteSegments());
    }

    getStandaloneSegmentPath(segmentIndex: number): string | null {
        const { standaloneBySegment } = this.getCanvasGeometry();
        return standaloneBySegment[segmentIndex] ?? null;
    }

    setSegmentValue(segmentIndex: number, valueIndex: number, value: number) {
        const segment = this.segments[segmentIndex];
        if (!segment) return;
        if (valueIndex < 0 || valueIndex >= segment.values.length) return;
        if (!Number.isFinite(value)) return;
        segment.values[valueIndex] = value;
    }

    setTargetPointLocation(segmentIndex: number, target: Point) {
        const absolute = this.computeAbsoluteSegments();
        const segmentData = absolute[segmentIndex];
        if (!segmentData) return;

        const segment = this.segments[segmentIndex];
        const cmd = upper(segment.command);

        switch (cmd) {
            case "Z":
                return;
            case "H":
                segment.values[0] = isRelative(segment.command)
                    ? target.x - segmentData.start.x
                    : target.x;
                return;
            case "V":
                segment.values[0] = isRelative(segment.command)
                    ? target.y - segmentData.start.y
                    : target.y;
                return;
            case "A":
                if (isRelative(segment.command)) {
                    segment.values[5] = target.x - segmentData.start.x;
                    segment.values[6] = target.y - segmentData.start.y;
                } else {
                    segment.values[5] = target.x;
                    segment.values[6] = target.y;
                }
                return;
            default: {
                const valueCount = segment.values.length;
                if (valueCount < 2) return;

                if (isRelative(segment.command)) {
                    segment.values[valueCount - 2] = target.x - segmentData.start.x;
                    segment.values[valueCount - 1] = target.y - segmentData.start.y;
                } else {
                    segment.values[valueCount - 2] = target.x;
                    segment.values[valueCount - 1] = target.y;
                }
            }
        }
    }

    setControlPointLocation(segmentIndex: number, controlIndex: number, next: Point) {
        const absolute = this.computeAbsoluteSegments();
        const segmentData = absolute[segmentIndex];
        if (!segmentData) return;

        const segment = this.segments[segmentIndex];
        const cmd = upper(segment.command);
        const relative = isRelative(segment.command);

        function setXY(xIndex: number, yIndex: number) {
            if (relative) {
                segment.values[xIndex] = next.x - segmentData.start.x;
                segment.values[yIndex] = next.y - segmentData.start.y;
            } else {
                segment.values[xIndex] = next.x;
                segment.values[yIndex] = next.y;
            }
        }

        if (cmd === "C") {
            if (controlIndex === 0) setXY(0, 1);
            if (controlIndex === 1) setXY(2, 3);
            return;
        }

        if (cmd === "S" && controlIndex === 1) {
            setXY(0, 1);
            return;
        }

        if (cmd === "Q" && controlIndex === 0) {
            setXY(0, 1);
        }
    }

    setCanvasPointLocation(point: SvgCanvasPoint, to: Point) {
        if (point.kind === "target") {
            this.setTargetPointLocation(point.segmentIndex, to);
            return;
        }
        this.setControlPointLocation(point.segmentIndex, point.controlIndex, to);
    }

    canDelete(segmentIndex: number): boolean {
        return segmentIndex > 0 && segmentIndex < this.segments.length;
    }

    deleteSegment(segmentIndex: number) {
        if (!this.canDelete(segmentIndex)) return;
        this.segments.splice(segmentIndex, 1);
    }

    canInsertAfter(afterIndex: number | null, commandType: string): boolean {
        const type = upper(commandType);
        let previousType: string | null = null;

        if (afterIndex !== null && afterIndex >= 0 && afterIndex < this.segments.length) {
            previousType = upper(this.segments[afterIndex].command);
        } else if (this.segments.length > 0) {
            previousType = upper(this.segments[this.segments.length - 1].command);
        }

        if (!previousType) return type !== "Z";
        if (previousType === "M") return type !== "M" && type !== "Z" && type !== "T" && type !== "S";
        if (previousType === "Z") return type !== "Z" && type !== "T" && type !== "S";
        if (previousType === "C" || previousType === "S") return type !== "T";
        if (previousType === "Q" || previousType === "T") return type !== "S";
        return type !== "T" && type !== "S";
    }

    canConvert(segmentIndex: number, toCommandType: string): boolean {
        if (segmentIndex <= 0 || segmentIndex >= this.segments.length) return false;
        return this.canInsertAfter(segmentIndex - 1, toCommandType);
    }

    insertSegment(type: string, afterIndex: number | null): number | null {
        const command = type || "L";
        const cmd = upper(command);
        if (!this.canInsertAfter(afterIndex, command)) return null;

        const absolute = this.computeAbsoluteSegments();
        let anchor: Point = { x: 0, y: 0 };

        if (afterIndex !== null && afterIndex >= 0 && afterIndex < absolute.length) {
            anchor = { ...absolute[afterIndex].end };
        } else if (absolute.length > 0) {
            anchor = { ...absolute[absolute.length - 1].end };
        }

        let insertAt = afterIndex === null ? this.segments.length : Math.min(this.segments.length, afterIndex + 1);

        if (this.segments.length === 0 && cmd !== "M") {
            this.segments.push({ command: "M", values: [0, 0] });
            insertAt = this.segments.length;
        }

        const newSegment = this.createSegmentForType(command, anchor);
        this.segments.splice(insertAt, 0, newSegment);
        return insertAt;
    }

    changeSegmentType(segmentIndex: number, toCommandType: string): boolean {
        if (!this.canConvert(segmentIndex, toCommandType)) return false;
        const absolute = this.computeAbsoluteSegments();
        const current = absolute[segmentIndex];
        if (!current) return false;

        const toUpper = upper(toCommandType);
        const toRelative = isRelative(toCommandType);
        const start = current.start;
        const end = current.end;

        let nextAbsoluteValues: number[] = [];
        switch (toUpper) {
            case "M":
            case "L":
                nextAbsoluteValues = [end.x, end.y];
                break;
            case "H":
                nextAbsoluteValues = [end.x];
                break;
            case "V":
                nextAbsoluteValues = [end.y];
                break;
            case "C":
                nextAbsoluteValues = [
                    (2 * start.x + end.x) / 3,
                    (2 * start.y + end.y) / 3,
                    (start.x + 2 * end.x) / 3,
                    (start.y + 2 * end.y) / 3,
                    end.x,
                    end.y,
                ];
                break;
            case "S":
                nextAbsoluteValues = [
                    (start.x + 2 * end.x) / 3,
                    (start.y + 2 * end.y) / 3,
                    end.x,
                    end.y,
                ];
                break;
            case "Q":
                nextAbsoluteValues = [
                    (start.x + end.x) / 2,
                    (start.y + end.y) / 2,
                    end.x,
                    end.y,
                ];
                break;
            case "T":
                nextAbsoluteValues = [end.x, end.y];
                break;
            case "A":
                nextAbsoluteValues = [1, 1, 0, 0, 0, end.x, end.y];
                break;
            case "Z":
                nextAbsoluteValues = [];
                break;
            default:
                return false;
        }

        const nextValues = toRelative
            ? this.absoluteToRelativeValues(toUpper, nextAbsoluteValues, start)
            : nextAbsoluteValues;

        this.segments[segmentIndex].command = toRelative ? toUpper.toLowerCase() : toUpper;
        this.segments[segmentIndex].values = nextValues;
        return true;
    }

    toggleSegmentRelative(segmentIndex: number) {
        const segment = this.segments[segmentIndex];
        if (!segment) return;

        const absolute = this.computeAbsoluteSegments();
        const data = absolute[segmentIndex];
        if (!data) return;

        const currentlyRelative = isRelative(segment.command);
        if (currentlyRelative) {
            segment.command = upper(segment.command);
            segment.values = [...data.values];
            return;
        }

        segment.command = segment.command.toLowerCase();
        segment.values = this.absoluteToRelativeValues(data.command, data.values, data.start);
    }

    scale(scaleX: number, scaleY: number) {
        this.segments.forEach(
            (segment) => {
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
            }
        );
    }

    translate(deltaX: number, deltaY: number) {
        this.segments.forEach(
            (segment, index) => {
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
            }
        );
    }

    translateSegments(segmentIndices: number[], deltaX: number, deltaY: number) {
        if (!segmentIndices.length) return;
        if (deltaX === 0 && deltaY === 0) return;

        const absolute = this.computeAbsoluteSegments();
        const selected = new Set(segmentIndices.filter(
            (index) => index >= 0 && index < absolute.length)
        );
        if (!selected.size) return;

        const subpathStartSegmentByIndex = new Map<number, number>();
        let currentSubpathStartIndex = 0;
        absolute.forEach(
            (segmentData) => {
                if (segmentData.command === "M") {
                    currentSubpathStartIndex = segmentData.index;
                }
                subpathStartSegmentByIndex.set(segmentData.index, currentSubpathStartIndex);
            }
        );

        const targetTranslated = new Set<number>();
        absolute.forEach(
            (segmentData) => {
                if (!selected.has(segmentData.index)) return;

                if (segmentData.command === "Z") {
                    const previousIndex = segmentData.index - 1;
                    if (previousIndex >= 0) {
                        targetTranslated.add(previousIndex);
                    }
                    targetTranslated.add(subpathStartSegmentByIndex.get(segmentData.index) ?? 0);
                    return;
                }

                targetTranslated.add(segmentData.index);

                const previousIndex = segmentData.index - 1;
                if (previousIndex >= 0 && !selected.has(previousIndex)) {
                    targetTranslated.add(previousIndex);
                }
            }
        );

        const translatedAbsoluteValues = absolute.map(
            (segmentData) => {
                const nextValues = [...segmentData.values];
                if (selected.has(segmentData.index)) {
                    translateAbsoluteSegmentValues(segmentData.command, nextValues, deltaX, deltaY);
                } else if (targetTranslated.has(segmentData.index)) {
                    translateAbsoluteSegmentTarget(segmentData.command, nextValues, deltaX, deltaY);
                }
                return nextValues;
            }
        );

        let current: Point = { x: 0, y: 0 };
        let subpathStart: Point = { x: 0, y: 0 };

        this.segments.forEach(
            (segment, index) => {
                const command = upper(segment.command);
                const absoluteValues = translatedAbsoluteValues[index] ?? [];
                segment.values = isRelative(segment.command)
                    ? this.absoluteToRelativeValues(command, absoluteValues, current)
                    : absoluteValues;

                const target = getSegmentTargetFromAbsolute(command, absoluteValues, current, subpathStart);
                if (command === "M") {
                    subpathStart = clonePoint(target);
                }
                current = command === "Z" ? clonePoint(subpathStart) : clonePoint(target);
            }
        );
    }

    scaleSegments(segmentIndices: number[], scaleX: number, scaleY: number, pivot: Point) {
        if (!segmentIndices.length) return;
        if (scaleX === 1 && scaleY === 1) return;
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return;

        const absolute = this.computeAbsoluteSegments();
        const selected = new Set(segmentIndices.filter((index) => index >= 0 && index < absolute.length));
        if (!selected.size) return;

        const subpathStartSegmentByIndex = new Map<number, number>();
        let currentSubpathStartIndex = 0;
        absolute.forEach(
            (segmentData) => {
                if (segmentData.command === "M") {
                    currentSubpathStartIndex = segmentData.index;
                }
                subpathStartSegmentByIndex.set(segmentData.index, currentSubpathStartIndex);
            }
        );

        const targetScaled = new Set<number>();
        absolute.forEach(
            (segmentData) => {
                if (!selected.has(segmentData.index)) return;

                if (segmentData.command === "Z") {
                    const previousIndex = segmentData.index - 1;
                    if (previousIndex >= 0) {
                        targetScaled.add(previousIndex);
                    }
                    targetScaled.add(subpathStartSegmentByIndex.get(segmentData.index) ?? 0);
                    return;
                }

                targetScaled.add(segmentData.index);

                const previousIndex = segmentData.index - 1;
                if (previousIndex >= 0 && !selected.has(previousIndex)) {
                    targetScaled.add(previousIndex);
                }
            }
        );

        const scaledAbsoluteValues = absolute.map(
            (segmentData) => {
                const nextValues = [...segmentData.values];
                if (selected.has(segmentData.index)) {
                    scaleAbsoluteSegmentValues(segmentData.command, nextValues, scaleX, scaleY, pivot.x, pivot.y);
                } else if (targetScaled.has(segmentData.index)) {
                    scaleAbsoluteSegmentTarget(segmentData.command, nextValues, scaleX, scaleY, pivot.x, pivot.y);
                }
                return nextValues;
            }
        );

        let current: Point = { x: 0, y: 0 };
        let subpathStart: Point = { x: 0, y: 0 };

        this.segments.forEach(
            (segment, index) => {
                const command = upper(segment.command);
                const absoluteValues = scaledAbsoluteValues[index] ?? [];
                segment.values = isRelative(segment.command)
                    ? this.absoluteToRelativeValues(command, absoluteValues, current)
                    : absoluteValues;

                const target = getSegmentTargetFromAbsolute(command, absoluteValues, current, subpathStart);
                if (command === "M") {
                    subpathStart = clonePoint(target);
                }
                current = command === "Z" ? clonePoint(subpathStart) : clonePoint(target);
            }
        );
    }

    setRelative(makeRelative: boolean) {
        const absolute = this.computeAbsoluteSegments();
        absolute.forEach(
            (entry) => {
                if (makeRelative) {
                    entry.segment.command = entry.command.toLowerCase();
                    entry.segment.values = this.absoluteToRelativeValues(entry.command, entry.values, entry.start);
                } else {
                    entry.segment.command = entry.command;
                    entry.segment.values = [...entry.values];
                }
            }
        );
    }

    private createSegmentForType(type: string, anchor: Point): SvgSegment {
        const relative = isRelative(type);
        const cmd = upper(type);
        const x = relative ? 0 : anchor.x;
        const y = relative ? 0 : anchor.y;

        switch (cmd) {
            case "M":
            case "L":
            case "T":
                return { command: type, values: [x, y] };
            case "H":
                return { command: type, values: [x] };
            case "V":
                return { command: type, values: [y] };
            case "S":
            case "Q":
                return { command: type, values: [x, y, x, y] };
            case "C":
                return { command: type, values: [x, y, x, y, x, y] };
            case "A":
                return { command: type, values: [1, 1, 0, 0, 0, x, y] };
            case "Z":
                return { command: type, values: [] };
            default:
                return { command: type, values: [x, y] };
        }
    }

    private computeAbsoluteSegments(): AbsoluteSegment[] {
        const computed: AbsoluteSegment[] = [];
        let current: Point = { x: 0, y: 0 };
        let subpathStart: Point = { x: 0, y: 0 };

        for (let index = 0; index < this.segments.length; index += 1) {
            const segment = this.segments[index];
            const absolute = this.toAbsoluteSegment(segment, current, subpathStart);
            const command = upper(segment.command);
            const start = clonePoint(current);
            const end = clonePoint(absolute.target);

            let reflectedCubicControl = clonePoint(start);
            let reflectedQuadraticControl = clonePoint(start);

            const previous = computed[computed.length - 1];
            if (command === "S" && previous) {
                if (previous.command === "C") {
                    reflectedCubicControl = reflectPoint({ x: previous.values[2], y: previous.values[3] }, start);
                } else if (previous.command === "S") {
                    reflectedCubicControl = reflectPoint({ x: previous.values[0], y: previous.values[1] }, start);
                }
            }
            if (command === "T" && previous) {
                if (previous.command === "Q") {
                    reflectedQuadraticControl = reflectPoint({ x: previous.values[0], y: previous.values[1] }, start);
                } else if (previous.command === "T") {
                    reflectedQuadraticControl = reflectPoint(previous.reflectedQuadraticControl, start);
                }
            }

            computed.push({
                index,
                segment,
                command,
                start,
                end,
                values: [...absolute.values],
                reflectedCubicControl,
                reflectedQuadraticControl,
            });

            if (command === "M") {
                subpathStart = clonePoint(end);
            }
            current = command === "Z" ? clonePoint(subpathStart) : clonePoint(end);
        }

        return computed;
    }

    private buildCanvasGeometry(absolute: AbsoluteSegment[]): SvgCanvasGeometry {
        const targets: SvgCanvasPoint[] = [];
        const controls: SvgCanvasPoint[] = [];
        const relationLines: SvgCanvasLine[] = [];
        const standaloneBySegment: string[] = [];

        const addControl = (args: {
            id: string;
            segmentIndex: number;
            controlIndex: number;
            x: number;
            y: number;
            movable: boolean;
            relations: Point[];
        }) => {
            controls.push({
                id: args.id,
                segmentIndex: args.segmentIndex,
                kind: "control",
                controlIndex: args.controlIndex,
                x: args.x,
                y: args.y,
                movable: args.movable,
                relations: args.relations.map((it) => ({ ...it })),
            });

            args.relations.forEach(
                (relation) => {
                    relationLines.push({
                        from: { x: args.x, y: args.y },
                        to: { ...relation },
                    });
                }
            );
        };

        absolute.forEach((segmentData) => {
            const { index, command, values, start, end } = segmentData;
            targets.push({
                id: `${index}:target`,
                segmentIndex: index,
                kind: "target",
                controlIndex: -1,
                x: end.x,
                y: end.y,
                movable: command !== "Z",
                relations: [],
            });

            if (command === "C") {
                addControl({
                    id: `${index}:control:0`,
                    segmentIndex: index,
                    controlIndex: 0,
                    x: values[0],
                    y: values[1],
                    movable: true,
                    relations: [start],
                });
                addControl({
                    id: `${index}:control:1`,
                    segmentIndex: index,
                    controlIndex: 1,
                    x: values[2],
                    y: values[3],
                    movable: true,
                    relations: [end],
                });
            }

            if (command === "S") {
                addControl({
                    id: `${index}:control:0`,
                    segmentIndex: index,
                    controlIndex: 0,
                    x: segmentData.reflectedCubicControl.x,
                    y: segmentData.reflectedCubicControl.y,
                    movable: false,
                    relations: [start],
                });
                addControl({
                    id: `${index}:control:1`,
                    segmentIndex: index,
                    controlIndex: 1,
                    x: values[0],
                    y: values[1],
                    movable: true,
                    relations: [end],
                });
            }

            if (command === "Q") {
                addControl({
                    id: `${index}:control:0`,
                    segmentIndex: index,
                    controlIndex: 0,
                    x: values[0],
                    y: values[1],
                    movable: true,
                    relations: [start, end],
                });
            }

            if (command === "T") {
                addControl({
                    id: `${index}:control:0`,
                    segmentIndex: index,
                    controlIndex: 0,
                    x: segmentData.reflectedQuadraticControl.x,
                    y: segmentData.reflectedQuadraticControl.y,
                    movable: false,
                    relations: [start, end],
                });
            }

            standaloneBySegment[index] = this.makeStandaloneSegmentPath(segmentData);
        });

        return {
            targets,
            controls,
            relationLines,
            standaloneBySegment,
        };
    }

    private makeStandaloneSegmentPath(segment: AbsoluteSegment): string {
        const start = `${formatNumber(segment.start.x, 4, false)} ${formatNumber(segment.start.y, 4, false)}`;
        const cmd = segment.command;

        if (cmd === "Z") {
            const end = `${formatNumber(segment.end.x, 4, false)} ${formatNumber(segment.end.y, 4, false)}`;
            return `M ${start} L ${end}`;
        }
        else if (cmd === "S") {
            const c1 = `${formatNumber(segment.reflectedCubicControl.x, 4, false)} ${formatNumber(segment.reflectedCubicControl.y, 4, false)}`;
            const c2 = `${formatNumber(segment.values[0], 4, false)} ${formatNumber(segment.values[1], 4, false)}`;
            const end = `${formatNumber(segment.end.x, 4, false)} ${formatNumber(segment.end.y, 4, false)}`;
            return `M ${start} C ${c1} ${c2} ${end}`;
        }
        else if (cmd === "T") {
            const c1 = `${formatNumber(segment.reflectedQuadraticControl.x, 4, false)} ${formatNumber(segment.reflectedQuadraticControl.y, 4, false)}`;
            const end = `${formatNumber(segment.end.x, 4, false)} ${formatNumber(segment.end.y, 4, false)}`;
            return `M ${start} Q ${c1} ${end}`;
        } else {
            const values = segment.values.map((value) => formatNumber(value, 4, false)).join(" ");
            return `M ${start} ${cmd}${values ? ` ${values}` : ""}`;
        }
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

function formatSegments(segments: SvgSegment[], decimals: number, minify: boolean): string {
    const chunked = segments.map((segment) => {
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

function reflectPoint(origin: Point, center: Point): Point {
    return {
        x: 2 * center.x - origin.x,
        y: 2 * center.y - origin.y,
    };
}

function clonePoint(point: Point): Point {
    return { x: point.x, y: point.y };
}

function translateAbsoluteSegmentValues(command: string, values: number[], deltaX: number, deltaY: number) {
    switch (command) {
        case "H":
            values[0] += deltaX;
            break;
        case "V":
            values[0] += deltaY;
            break;
        case "A":
            values[5] += deltaX;
            values[6] += deltaY;
            break;
        case "Z":
            break;
        default:
            for (let i = 0; i < values.length; i += 2) {
                values[i] += deltaX;
                values[i + 1] += deltaY;
            }
            break;
    }
}

function translateAbsoluteSegmentTarget(command: string, values: number[], deltaX: number, deltaY: number) {
    switch (command) {
        case "H":
            values[0] += deltaX;
            break;
        case "V":
            values[0] += deltaY;
            break;
        case "A":
            values[5] += deltaX;
            values[6] += deltaY;
            break;
        case "Z":
            break;
        default: {
            const xIndex = values.length - 2;
            const yIndex = values.length - 1;
            if (xIndex >= 0 && yIndex >= 0) {
                values[xIndex] += deltaX;
                values[yIndex] += deltaY;
            }
            break;
        }
    }
}

function scaleAbsoluteSegmentValues(command: string, values: number[], scaleX: number, scaleY: number, pivotX: number, pivotY: number) {
    const scaleAround = (value: number, pivot: number, scale: number) => pivot + (value - pivot) * scale;

    switch (command) {
        case "M":
        case "L":
        case "T":
        case "C":
        case "S":
        case "Q":
            for (let i = 0; i < values.length; i += 2) {
                values[i] = scaleAround(values[i], pivotX, scaleX);
                values[i + 1] = scaleAround(values[i + 1], pivotY, scaleY);
            }
            break;
        case "H":
            values[0] = scaleAround(values[0], pivotX, scaleX);
            break;
        case "V":
            values[0] = scaleAround(values[0], pivotY, scaleY);
            break;
        case "A":
            // Radii scale with magnitude; endpoint scales around pivot.
            values[0] = Math.abs(values[0] * scaleX);
            values[1] = Math.abs(values[1] * scaleY);
            values[5] = scaleAround(values[5], pivotX, scaleX);
            values[6] = scaleAround(values[6], pivotY, scaleY);
            break;
        case "Z":
            break;
        default:
            break;
    }
}

function scaleAbsoluteSegmentTarget(command: string, values: number[], scaleX: number, scaleY: number, pivotX: number, pivotY: number) {
    const scaleAround = (value: number, pivot: number, scale: number) => pivot + (value - pivot) * scale;

    switch (command) {
        case "H":
            values[0] = scaleAround(values[0], pivotX, scaleX);
            break;
        case "V":
            values[0] = scaleAround(values[0], pivotY, scaleY);
            break;
        case "A":
            values[5] = scaleAround(values[5], pivotX, scaleX);
            values[6] = scaleAround(values[6], pivotY, scaleY);
            break;
        case "M":
        case "L":
        case "T":
        case "C":
        case "S":
        case "Q":
            {
                const xIndex = values.length - 2;
                const yIndex = values.length - 1;
                if (xIndex >= 0 && yIndex >= 0) {
                    values[xIndex] = scaleAround(values[xIndex], pivotX, scaleX);
                    values[yIndex] = scaleAround(values[yIndex], pivotY, scaleY);
                }
            }
            break;
        default: {
            const xIndex = values.length - 2;
            const yIndex = values.length - 1;
            if (xIndex >= 0 && yIndex >= 0) {
                values[xIndex] = scaleAround(values[xIndex], pivotX, scaleX);
                values[yIndex] = scaleAround(values[yIndex], pivotY, scaleY);
            }
        }
            break;
    }
}

function getSegmentTargetFromAbsolute(command: string, values: number[], current: Point, subpathStart: Point): Point {
    switch (command) {
        case "Z":
            return clonePoint(subpathStart);
        case "H":
            return { x: values[0] ?? current.x, y: current.y };
        case "V":
            return { x: current.x, y: values[0] ?? current.y };
        case "A":
            return { x: values[5] ?? current.x, y: values[6] ?? current.y };
        default:
            return {
                x: values[values.length - 2] ?? current.x,
                y: values[values.length - 1] ?? current.y,
            };
    }
}

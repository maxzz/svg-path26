import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type SvgInputNode } from "@/svg-core/3-svg-input";
import { cn } from "@/utils";

const INDENT_PX = 18;

interface SvgTreeViewProps {
    root: SvgInputNode | null;
    selectedNodeId: string | null;
    onSelectNode: (nodeId: string) => void;
    onPasteText?: (text: string) => void;
    showConnectorLines?: boolean;
    parseError?: string | null;
    className?: string;
}

export function SvgTreeView(props: SvgTreeViewProps) {
    const { root, selectedNodeId, onSelectNode, onPasteText, showConnectorLines = true, parseError, className } = props;

    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => root ? new Set([root.id]) : new Set());
    const pasteTargetRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(
        () => {
            setExpandedNodeIds(root ? new Set([root.id]) : new Set());
        },
        [root]);

    function queuePasteTargetFocus() {
        window.setTimeout(() => {
            pasteTargetRef.current?.focus({ preventScroll: true });
        }, 0);
    }

    return (
        <div className={cn("relative rounded border bg-muted/20 font-mono text-[11px] outline-none focus-within:ring-1 focus-within:ring-ring", className)}>

            <textarea
                ref={pasteTargetRef}
                tabIndex={-1}
                className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
                onPaste={(event) => handlePaste(event, onPasteText)}
                aria-hidden="true"
            />

            <div
                className="overflow-auto"
                tabIndex={0}
                onFocus={queuePasteTargetFocus}
                onClickCapture={queuePasteTargetFocus}
                role="tree"
                aria-label="SVG structure"
            >
                {root
                    ? (
                        <ul role="group" className="py-1">
                            <SvgTreeBranch
                                node={root}
                                depth={0}
                                isLast
                                ancestryHasNext={[]}
                                expandedNodeIds={expandedNodeIds}
                                selectedNodeId={selectedNodeId}
                                showConnectorLines={showConnectorLines}
                                onSelectNode={onSelectNode}
                                onToggleNode={(nodeId: string) => {
                                    setExpandedNodeIds(
                                        (current) => {
                                            const next = new Set(current);
                                            if (next.has(nodeId)) {
                                                next.delete(nodeId);
                                            } else {
                                                next.add(nodeId);
                                            }
                                            return next;
                                        }
                                    );
                                }}
                            />
                        </ul>
                    )
                    : (
                        <div className="px-3 py-3 text-[11px] leading-5 text-muted-foreground">
                            Paste SVG markup, a path element, or path data here.
                        </div>
                    )}
            </div>

            {parseError ? (
                <div className="border-t border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                    {parseError}
                </div>
            ) : null}
        </div>
    );
}

function SvgTreeBranch(props: {
    node: SvgInputNode;
    depth: number;
    isLast: boolean;
    ancestryHasNext: boolean[];
    expandedNodeIds: Set<string>;
    selectedNodeId: string | null;
    showConnectorLines: boolean;
    onSelectNode: (nodeId: string) => void;
    onToggleNode: (nodeId: string) => void;
}) {
    const { node, depth, isLast, ancestryHasNext, expandedNodeIds, selectedNodeId, showConnectorLines, onSelectNode, onToggleNode } = props;
    const hasChildren = node.children.length > 0;
    const expanded = expandedNodeIds.has(node.id);
    const selected = selectedNodeId === node.id;

    return (
        <li className="list-none">
            <div
                className="relative min-h-6"
                role="treeitem"
                aria-selected={selected}
                aria-expanded={hasChildren ? expanded : undefined}
            >
                {showConnectorLines ? (
                    <TreeConnectors depth={depth} isLast={isLast} ancestryHasNext={ancestryHasNext} />
                ) : null}

                <div className="flex items-center gap-0.5 pr-1" style={{ paddingLeft: depth * INDENT_PX }}>
                    {hasChildren
                        ? (
                            <button
                                className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-slate-400/20 hover:text-foreground"
                                onClick={() => onToggleNode(node.id)}
                                aria-label={`${expanded ? "Collapse" : "Expand"} ${node.tagName}`}
                                type="button"
                            >
                                {expanded
                                    ? <ChevronDown className="size-3" />
                                    : <ChevronRight className="size-3" />
                                }
                            </button>
                        ) : (
                            <span className="size-4 shrink-0" aria-hidden="true" />
                        )
                    }

                    <button
                        className={cn("min-w-0 flex-1 overflow-hidden rounded px-1 py-0.5 text-left leading-5 transition-colors hover:bg-slate-400/20", selected ? "bg-blue-300 text-slate-950" : "text-foreground/90",)}
                        onClick={() => onSelectNode(node.id)}
                        title={formatNodeLabel(node, false)}
                        type="button"
                    >
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                            {formatNodeLabel(node, true)}
                        </span>
                    </button>
                </div>
            </div>

            {hasChildren && expanded ? (
                <ul role="group">
                    {node.children.map((child, index) => (
                        <SvgTreeBranch
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            isLast={index === node.children.length - 1}
                            ancestryHasNext={[...ancestryHasNext, !isLast]}
                            expandedNodeIds={expandedNodeIds}
                            selectedNodeId={selectedNodeId}
                            showConnectorLines={showConnectorLines}
                            onSelectNode={onSelectNode}
                            onToggleNode={onToggleNode}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

function TreeConnectors(props: { depth: number; isLast: boolean; ancestryHasNext: boolean[]; }) {
    const { depth, isLast, ancestryHasNext } = props;

    return (<>
        {ancestryHasNext.map((hasNext, index) => hasNext ? (
            <span
                key={`ancestor:${index}`}
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-border/70"
                style={{ left: index * INDENT_PX + Math.floor(INDENT_PX / 2) }}
                aria-hidden="true"
            />
        ) : null)}

        {depth > 0 ? (
            <>
                <span
                    className="pointer-events-none absolute w-px bg-border/70"
                    style={{
                        left: depth * INDENT_PX - Math.floor(INDENT_PX / 2),
                        top: 0,
                        bottom: isLast ? "50%" : 0,
                    }}
                    aria-hidden="true"
                />
                <span
                    className="pointer-events-none absolute h-px bg-border/70"
                    style={{
                        left: depth * INDENT_PX - Math.floor(INDENT_PX / 2),
                        top: "50%",
                        width: Math.floor(INDENT_PX / 2),
                    }}
                    aria-hidden="true"
                />
            </>
        ) : null}
    </>);
}

function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>, onPasteText?: (text: string) => void) {
    if (!onPasteText) return;

    const text = event.clipboardData.getData("text");
    if (!text.trim()) return;

    event.preventDefault();
    onPasteText(text);
}

function formatNodeLabel(node: SvgInputNode, truncateValues: boolean): string {
    const attributes = node.attributes
        .map((attribute) => `${attribute.name}="${formatAttributeValue(attribute.value, attribute.name === "d" ? 48 : 24, truncateValues)}"`)
        .join(" ");

    const openTag = attributes ? `<${node.tagName} ${attributes}` : `<${node.tagName}`;
    return node.children.length ? `${openTag}>` : `${openTag} />`;
}

function formatAttributeValue(value: string, maxLength: number, truncate: boolean): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!truncate || normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

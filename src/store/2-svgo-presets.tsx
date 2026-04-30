type SvgoPresetDefaultPluginDefinition = {
    id: string;
    label: string;
    description: string;
};

export const SVGO_PRESET_DEFAULT = {
    id: "preset-default",
    label: "Default",
    description: "SVGO's standard optimization pipeline. Disable individual steps when they are not appropriate for a specific export.",
} as const;

export const SVGO_PRESET_DEFAULT_PLUGINS = [
    {
        id: "removeDoctype",
        label: "Remove doctype",
        description: "Removes the document type definition (DOCTYPE) from the SVG.",
    },
    {
        id: "removeXMLProcInst",
        label: "Remove XML instructions",
        description: "Removes XML processing instructions such as the XML declaration.",
    },
    {
        id: "removeComments",
        label: "Remove comments",
        description: "Removes comments from the SVG source.",
    },
    {
        id: "removeMetadata",
        label: "Remove <metadata>",
        description: "Removes the <metadata> element from the document.",
    },
    {
        id: "removeEditorsNSData",
        label: "Remove editor data",
        description: "Removes editor-specific namespaces, elements, and attributes.",
    },
    {
        id: "cleanupAttrs",
        label: "Clean up attribute whitespace",
        description: "Removes redundant whitespace from attribute values.",
    },
    {
        id: "mergeStyles",
        label: "Merge styles",
        description: "Merges multiple style elements and repeated CSS rules.",
    },
    {
        id: "inlineStyles",
        label: "Inline styles",
        description: "Moves CSS rules into inline styles when that reduces output size.",
    },
    {
        id: "minifyStyles",
        label: "Minify styles",
        description: "Minifies CSS inside style elements and style attributes.",
    },
    {
        id: "cleanupIds",
        label: "Clean up IDs",
        description: "Removes unused IDs and minifies referenced IDs.",
    },
    {
        id: "removeUselessDefs",
        label: "Remove unused defs",
        description: "Removes defs content that cannot be referenced or rendered.",
    },
    {
        id: "cleanupNumericValues",
        label: "Round/rewrite numbers",
        description: "Rounds numeric values and rewrites them into shorter equivalents.",
    },
    {
        id: "convertColors",
        label: "Minify colors",
        description: "Converts color values to shorter equivalent forms when possible.",
    },
    {
        id: "removeUnknownsAndDefaults",
        label: "Remove unknowns & defaults",
        description: "Removes unknown elements or attributes and values already implied by defaults.",
    },
    {
        id: "removeNonInheritableGroupAttrs",
        label: "Remove unneeded group attrs",
        description: "Removes non-inheritable presentation attributes from group elements.",
    },
    {
        id: "removeUselessStrokeAndFill",
        label: "Remove useless stroke & fill",
        description: "Removes stroke or fill attributes that do not affect rendering.",
    },
    {
        id: "cleanupEnableBackground",
        label: "Remove/tidy enable-background",
        description: "Removes or normalizes the legacy enable-background attribute.",
    },
    {
        id: "removeHiddenElems",
        label: "Remove hidden elements",
        description: "Removes hidden or non-rendering elements that do not affect the result.",
    },
    {
        id: "removeEmptyText",
        label: "Remove empty text",
        description: "Removes empty text nodes and text elements.",
    },
    {
        id: "convertShapeToPath",
        label: "Shapes to smaller paths",
        description: "Converts basic shapes to more compact path data.",
    },
    {
        id: "convertEllipseToCircle",
        label: "Convert ellipse to circle",
        description: "Converts ellipses with equal radii into circle elements.",
    },
    {
        id: "moveElemsAttrsToGroup",
        label: "Move attrs to parent group",
        description: "Moves shared child attributes up to the parent group.",
    },
    {
        id: "moveGroupAttrsToElems",
        label: "Move group attrs to elements",
        description: "Moves group attributes down to children when that is smaller.",
    },
    {
        id: "collapseGroups",
        label: "Collapse useless groups",
        description: "Removes group wrappers that are not needed.",
    },
    {
        id: "convertPathData",
        label: "Round/rewrite path data",
        description: "Optimizes path commands and rewrites coordinates more compactly.",
    },
    {
        id: "convertTransform",
        label: "Round/rewrite transforms",
        description: "Optimizes transform values and shortens transform syntax.",
    },
    {
        id: "removeEmptyAttrs",
        label: "Remove empty attrs",
        description: "Removes empty attributes from elements.",
    },
    {
        id: "removeEmptyContainers",
        label: "Remove empty containers",
        description: "Removes empty container elements.",
    },
    {
        id: "removeUnusedNS",
        label: "Remove unused namespaces",
        description: "Removes namespace declarations that are not used.",
    },
    {
        id: "mergePaths",
        label: "Merge paths",
        description: "Merges compatible paths into fewer elements.",
    },
    {
        id: "sortAttrs",
        label: "Sort attrs",
        description: "Sorts attributes for slightly better compression.",
    },
    {
        id: "sortDefsChildren",
        label: "Sort <defs> children",
        description: "Sorts children inside <defs> for better compression.",
    },
    {
        id: "removeDesc",
        label: "Remove <desc>",
        description: "Removes empty or editor-generated <desc> elements.",
    },
] as const satisfies readonly SvgoPresetDefaultPluginDefinition[];

export type SvgoPresetDefaultPlugin = (typeof SVGO_PRESET_DEFAULT_PLUGINS)[number];
export type SvgoPresetDefaultPluginName = SvgoPresetDefaultPlugin["id"];
export type SvgoPresetDefaultPluginOptions = Record<SvgoPresetDefaultPluginName, boolean>;

export const SVGO_PRESET_DEFAULT_PLUGIN_NAMES = SVGO_PRESET_DEFAULT_PLUGINS.map(
    (plugin) => plugin.id
) as SvgoPresetDefaultPluginName[];
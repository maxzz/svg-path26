const COMMAND_REGEX = /^[\t\n\f\r ]*([MLHVZCSQTAmlhvzcsqta])[\t\n\f\r ]*/
const FLAG_REGEX = /^[01]/
const NUMBER_REGEX = /^[+-]?(([0-9]*\.[0-9]+)|([0-9]+\.)|([0-9]+))([eE][+-]?[0-9]+)?/
const COORDINATE_REGEX = NUMBER_REGEX
const COMMA_OR_WHITESPACE_REGEX = /^(([\t\n\f\r ]+,?[\t\n\f\r ]*)|(,[\t\n\f\r ]*))/

const COMMAND_GRAMMAR: Record<string, RegExp[]> = {
    M: [COORDINATE_REGEX, COORDINATE_REGEX],
    L: [COORDINATE_REGEX, COORDINATE_REGEX],
    H: [COORDINATE_REGEX],
    V: [COORDINATE_REGEX],
    Z: [],
    C: [COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX],
    S: [COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX],
    Q: [COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX, COORDINATE_REGEX],
    T: [COORDINATE_REGEX, COORDINATE_REGEX],
    A: [NUMBER_REGEX, NUMBER_REGEX, COORDINATE_REGEX, FLAG_REGEX, FLAG_REGEX, COORDINATE_REGEX, COORDINATE_REGEX],
}

function parseComponents(type: string, path: string, cursor: number): [number, string[][]] {
    const expected = COMMAND_GRAMMAR[type.toUpperCase()]
    const components: string[][] = []

    while (cursor <= path.length) {
        const component: string[] = [type]

        for (const regex of expected) {
            const match = path.slice(cursor).match(regex)
            if (match) {
                component.push(match[0])
                cursor += match[0].length

                const trailing = path.slice(cursor).match(COMMA_OR_WHITESPACE_REGEX)
                if (trailing) {
                    cursor += trailing[0].length
                }
            } else if (component.length === 1) {
                return [cursor, components]
            } else {
                throw new Error(`Malformed SVG path (first error at ${cursor})`)
            }
        }

        components.push(component)

        if (expected.length === 0) {
            return [cursor, components]
        }

        // Implicit lineto commands after moveto pairs.
        if (type === "m") type = "l"
        if (type === "M") type = "L"
    }

    throw new Error(`Malformed SVG path (first error at ${cursor})`)
}

export function parseSvgPath(path: string): string[][] {
    let cursor = 0
    let tokens: string[][] = []

    while (cursor < path.length) {
        const match = path.slice(cursor).match(COMMAND_REGEX)
        if (!match) {
            throw new Error(`Malformed SVG path (first error at ${cursor})`)
        }

        const command = match[1]
        cursor += match[0].length

        const [nextCursor, components] = parseComponents(command, path, cursor)
        cursor = nextCursor
        tokens = [...tokens, ...components]
    }

    return tokens
}

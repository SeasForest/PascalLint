import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: camel-case
 * Enforce camelCase for local variables and parameters
 */
export const camelCaseRule: LintRule = {
    id: 'camel-case',
    meta: {
        description: 'Enforce camelCase naming for local variables and parameters',
        category: 'style',
        fixable: false,
        docs: {
            description:
                'Local variables and parameters should follow camelCase convention (e.g., myVariable, inputValue).',
        },
    },
    defaultSeverity: 'info',
    create(context: RuleContext): RuleListener {
        return {
            variable_declaration(node: TreeSitterNode) {
                // Find variable names in the declaration
                checkCamelCase(node, context, 'Variable');
            },
            parameter(node: TreeSitterNode) {
                // Find parameter name
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkCamelCaseName(nameChild.text, nameChild, context, 'Parameter');
                }
            },
        };
    },
};

function checkCamelCase(node: TreeSitterNode, context: RuleContext, kind: string): void {
    // Look for identifier children
    for (const child of node.namedChildren) {
        if (child.type === 'identifier') {
            checkCamelCaseName(child.text, child, context, kind);
        }
    }
}

function checkCamelCaseName(
    name: string,
    node: TreeSitterNode,
    context: RuleContext,
    kind: string
): void {
    if (!name || name.length <= 1) {
        return;
    }

    // Skip if starts with uppercase (might be a type or constant)
    // or if it's a common Delphi prefix
    const skipPrefixes = ['F', 'A', 'T', 'I', 'E'];
    if (skipPrefixes.includes(name[0]) && name.length > 1 && /[A-Z]/.test(name[1])) {
        return;
    }

    // camelCase: first letter lowercase, no underscores
    const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name);
    // Also accept lowercase_with_underscores for some cases
    const isSnakeCase = /^[a-z][a-z0-9_]*$/.test(name);

    if (!isCamelCase && !isSnakeCase) {
        // Check if it's just all uppercase (might be intentional)
        if (/^[A-Z][A-Z0-9]*$/.test(name)) {
            return; // Skip constants
        }

        context.report({
            message: `${kind} '${name}' should use camelCase naming convention.`,
            range: {
                start: {
                    line: node.startPosition.row,
                    column: node.startPosition.column,
                    offset: node.startIndex,
                },
                end: {
                    line: node.endPosition.row,
                    column: node.endPosition.column,
                    offset: node.endIndex,
                },
            },
        });
    }
}

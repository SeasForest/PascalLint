import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: one-var-per-line
 * Enforce one variable declaration per line
 */
export const oneVarPerLineRule: LintRule = {
    id: 'one-var-per-line',
    meta: {
        description: 'Enforce one variable declaration per line',
        category: 'style',
        fixable: false, // Splitting declarations is complex
        docs: {
            description:
                'Each variable should be declared on its own line for better readability and diff tracking.',
        },
    },
    defaultSeverity: 'info',
    create(context: RuleContext): RuleListener {
        return {
            variable_declaration(node: TreeSitterNode) {
                // Check if multiple identifiers are declared in one statement
                // Pattern: var a, b, c: Integer;
                const text = node.text;

                // Count commas before the colon (type separator)
                const colonIndex = text.indexOf(':');
                if (colonIndex === -1) {
                    return;
                }

                const beforeColon = text.substring(0, colonIndex);
                const commaCount = (beforeColon.match(/,/g) || []).length;

                if (commaCount > 0) {
                    context.report({
                        message: `Multiple variables (${commaCount + 1}) declared on one line. Consider one variable per line.`,
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
            },
        };
    },
};

import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: unreachable-code
 * Detect code after return, raise, exit statements
 */
export const unreachableCodeRule: LintRule = {
    id: 'unreachable-code',
    meta: {
        description: 'Detect unreachable code after return, raise, or exit',
        category: 'error',
        fixable: false,
        docs: {
            description:
                'Code after return, raise, or exit statements will never execute.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            compound_statement(node: TreeSitterNode) {
                // Check for statements after terminating statements
                const children = node.namedChildren;
                let foundTerminator = false;

                for (let i = 0; i < children.length; i++) {
                    const child = children[i];

                    if (foundTerminator) {
                        // This code is unreachable
                        context.report({
                            message: 'Unreachable code detected.',
                            range: {
                                start: {
                                    line: child.startPosition.row,
                                    column: child.startPosition.column,
                                    offset: child.startIndex,
                                },
                                end: {
                                    line: child.endPosition.row,
                                    column: child.endPosition.column,
                                    offset: child.endIndex,
                                },
                            },
                        });
                        break; // Only report once per block
                    }

                    // Check if this is a terminating statement
                    if (isTerminatingStatement(child)) {
                        foundTerminator = true;
                    }
                }
            },
        };
    },
};

function isTerminatingStatement(node: TreeSitterNode): boolean {
    const text = node.text.toLowerCase();
    const type = node.type.toLowerCase();

    // Exit, raise, halt
    if (type === 'exit_statement' || type === 'raise_statement') {
        return true;
    }

    // Return-like patterns
    if (text.startsWith('exit') || text.startsWith('raise') || text.startsWith('halt')) {
        return true;
    }

    // Result := xxx; followed by Exit in same function
    // This is a simplified check
    if (type === 'call_statement' && text.match(/\bexit\b/i)) {
        return true;
    }

    return false;
}

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
        fixable: true,
        docs: {
            description:
                'Code after return, raise, or exit statements will never execute.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            block(node: TreeSitterNode) {
                // Check for statements after terminating statements
                const children = node.namedChildren;
                let foundTerminator = false;

                for (let i = 0; i < children.length; i++) {
                    const child = children[i];

                    if (foundTerminator) {
                        // This code is unreachable
                        // Ignore comments
                        if (child.type === 'comment') continue;

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
                            fix: {
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
                                text: `{ Unreachable: ${child.text.replace(/}/g, '')} }`
                            }
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
    const type = node.type.toLowerCase();

    // Exit, raise
    // Exit is an identifier in a statement (exprCall) usually
    if (type === 'raise') {
        return true;
    }

    // Check for Exit call
    // statement -> exprCall -> (identifier "Exit")
    // or statement -> identifier "Exit"
    // Just check text roughly if node is statement

    if (type === 'statement') {
        // Check if it's a call to Exit
        if (node.text.toLowerCase() === 'exit') return true;
        // Exit; might include semicolon in text? No usually text is just the node content.
        if (node.text.toLowerCase().startsWith('exit')) return true;

        // raise statement might be parsed as statement?
        if (node.text.toLowerCase().startsWith('raise ')) return true;
    }

    // Handle 'exprCall' just in case structure differs
    if (type === 'exprcall') {
        if (node.text.toLowerCase() === 'exit') return true;
    }

    return false;
}

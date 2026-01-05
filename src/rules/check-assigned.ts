import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: check-assigned
 * Suggest checking Assigned() before calling Free
 */
export const checkAssignedRule: LintRule = {
    id: 'check-assigned',
    meta: {
        description: 'Suggest checking Assigned before Free',
        category: 'best-practice',
        fixable: false,
        docs: {
            description:
                'Before calling Free or FreeAndNil, check if the object is assigned to avoid access violations.',
        },
    },
    defaultSeverity: 'info',
    create(context: RuleContext): RuleListener {
        return {
            call_expression(node: TreeSitterNode) {
                const text = node.text;

                // Look for .Free or FreeAndNil patterns
                const freePattern = /^(\w+)\.Free$/i;
                const freeAndNilPattern = /^FreeAndNil\s*\(\s*(\w+)\s*\)$/i;

                let varName: string | null = null;
                const freeMatch = text.match(freePattern);
                const freeAndNilMatch = text.match(freeAndNilPattern);

                if (freeMatch) {
                    varName = freeMatch[1];
                } else if (freeAndNilMatch) {
                    varName = freeAndNilMatch[1];
                }

                if (varName) {
                    // Check if there's an Assigned check before this
                    const sourceCode = context.getSourceCode();
                    const lineStart = node.startPosition.row;

                    // Look at previous lines for Assigned check
                    const lines = sourceCode.split('\n');
                    let hasAssignedCheck = false;

                    // Check previous 5 lines for an Assigned check
                    for (let i = Math.max(0, lineStart - 5); i < lineStart; i++) {
                        const line = lines[i];
                        if (line && line.toLowerCase().includes(`assigned(${varName.toLowerCase()}`)) {
                            hasAssignedCheck = true;
                            break;
                        }
                        // Also check for nil comparison
                        if (line && line.toLowerCase().includes(`${varName.toLowerCase()} <> nil`)) {
                            hasAssignedCheck = true;
                            break;
                        }
                    }

                    if (!hasAssignedCheck) {
                        context.report({
                            message: `Consider checking 'Assigned(${varName})' before freeing.`,
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
            },
        };
    },
};

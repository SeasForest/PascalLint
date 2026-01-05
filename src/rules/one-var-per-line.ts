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
        fixable: true,
        docs: {
            description:
                'Each variable should be declared on its own line for better readability and diff tracking.',
        },
    },
    defaultSeverity: 'info',
    create(context: RuleContext): RuleListener {
        return {
            declVar(node: TreeSitterNode) {
                // Check if multiple identifiers are declared in one statement
                // Pattern: var a, b, c: Integer;
                // In AST: declVar has multiple 'name' fields which are identifiers


                // Or try checking specific field names if supported by adapter. 
                // Since our adapter maps namedChildren, we can just filter by type.
                // Actually the dump shows: (declVar name: (identifier) name: (identifier) ...)
                // So filtering namedChildren for 'identifier' (if that's what name field is) should work.

                // Note: The type is also a named child usually? (type (typeref ...))
                // Let's count how many identifiers appear before the colon/type.

                // Simple heuristic using text is still robust for the count:
                const text = node.text;
                const colonIndex = text.indexOf(':');
                if (colonIndex === -1) return;

                const beforeColon = text.substring(0, colonIndex);
                const commaCount = (beforeColon.match(/,/g) || []).length;

                if (commaCount > 0) {
                    // Fix: split into multiple lines
                    // var a, b: Integer; -> var a: Integer;\n  b: Integer;

                    // 1. Get the type part (after colon)
                    const typePart = text.substring(colonIndex + 1).trim();

                    // 2. Get variables part
                    const varPart = text.substring(0, colonIndex);
                    const vars = varPart.split(',').map(v => v.trim());

                    // 3. Get indentation
                    const startCol = node.startPosition.column;
                    const indent = ' '.repeat(startCol);

                    // 4. Construct replacement
                    // First var keeps the 'var ' prefix if it exists in parent? 
                    // Wait, this node is just the declaration "a, b: Integer;". 
                    // The "var" keyword is in the parent section usually.
                    // So we just replace "a, b: Integer;" with "a: Integer;\nINDENTb: Integer;"
                    // Check for semicolon at end
                    const hasSemicolon = text.trim().endsWith(';');
                    const suffix = hasSemicolon ? ';' : ''; // Usually yes
                    const typeSuffix = typePart.endsWith(';') ? typePart : typePart + suffix;

                    const newText = vars.map((v, i) => {
                        if (i === 0) return `${v}: ${typeSuffix}`;
                        return `${indent}${v}: ${typeSuffix}`;
                    }).join('\n');

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
                        fix: {
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
                            text: newText
                        }
                    });
                }
            },
        };
    },
};

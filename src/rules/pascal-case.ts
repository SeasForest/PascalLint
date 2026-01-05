import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: pascal-case
 * Enforce PascalCase for class names and method names
 */
export const pascalCaseRule: LintRule = {
    id: 'pascal-case',
    meta: {
        description: 'Enforce PascalCase naming for classes and methods',
        category: 'style',
        fixable: true,
        docs: {
            description:
                'Class names and method names should follow PascalCase convention (e.g., TMyClass, DoSomething). Note: Auto-fix only changes the declaration, refactoring usage is not supported.',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            declClass(node: TreeSitterNode) {
                // Class declaration often inside declType
                // e.g. TMyClass = class ...
                // The name is usually on the parent declType if it exists
                if (node.parent && node.parent.type === 'declType') {
                    const nameChild = node.parent.childForFieldName('name');
                    if (nameChild) {
                        checkPascalCase(nameChild, context, 'Class');
                    }
                }
            },
            declType(node: TreeSitterNode) {
                // Check if it's a class type: TMyClass = class
                // But declClass listener might handle it.
                // Let's check for interface or just generic types if we want
                // For now, simpler to let declClass handle classes if possible,
                // or just check all types if they look like class names

                const typeChild = node.childForFieldName('type');
                if (typeChild && (typeChild.type === 'declClass' || typeChild.type === 'kClass')) {
                    const nameChild = node.childForFieldName('name');
                    if (nameChild) {
                        checkPascalCase(nameChild, context, 'Class');
                    }
                }
            },
            declProc(node: TreeSitterNode) {
                // Procedure or Function
                const nameChild = node.childForFieldName('name');
                const kind = node.text.toLowerCase().startsWith('function') ? 'Function' : 'Procedure';
                if (nameChild) {
                    checkPascalCase(nameChild, context, kind);
                }
            },
        };
    },
};

function checkPascalCase(
    nameNode: TreeSitterNode,
    context: RuleContext,
    kind: string
): void {
    const name = nameNode.text;

    // Skip if empty or single character
    if (!name || name.length <= 1) {
        return;
    }

    // PascalCase: first letter uppercase, no underscores at start
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(name);
    // Delphi convention: class names often start with T
    const isDelphiClass = /^T[A-Z][a-zA-Z0-9]*$/.test(name);
    // Interface names often start with I
    const isDelphiInterface = /^I[A-Z][a-zA-Z0-9]*$/.test(name);

    if (!isPascalCase && !isDelphiClass && !isDelphiInterface) {
        // Check for common Delphi patterns to fix smart
        let fixedName = name;
        if (isDelphiClass) {
            // Already TSomething... check casing
        } else {
            // Basic fix: Capitalize first letter
            fixedName = name.charAt(0).toUpperCase() + name.slice(1);
        }

        // If it still doesn't match PascalCase (e.g. snake_case), do basic conversion
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(fixedName)) {
            // Convert snake_case to PascalCase
            fixedName = name.split('_')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join('');
        }

        context.report({
            message: `${kind} name '${name}' should follow PascalCase naming convention.`,
            range: {
                start: {
                    line: nameNode.startPosition.row,
                    column: nameNode.startPosition.column,
                    offset: nameNode.startIndex,
                },
                end: {
                    line: nameNode.endPosition.row,
                    column: nameNode.endPosition.column,
                    offset: nameNode.endIndex,
                },
            },
            fix: {
                range: {
                    start: {
                        line: nameNode.startPosition.row,
                        column: nameNode.startPosition.column,
                        offset: nameNode.startIndex,
                    },
                    end: {
                        line: nameNode.endPosition.row,
                        column: nameNode.endPosition.column,
                        offset: nameNode.endIndex,
                    },
                },
                text: fixedName
            }
        });
    }
}

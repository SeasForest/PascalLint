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
        fixable: false, // Name changes are too risky for auto-fix
        docs: {
            description:
                'Class names and method names should follow PascalCase convention (e.g., TMyClass, DoSomething).',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            class_declaration(node: TreeSitterNode) {
                // Find class name
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkPascalCase(nameChild, context, 'Class');
                }
            },
            type_declaration(node: TreeSitterNode) {
                // Find type name (for class types)
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkPascalCase(nameChild, context, 'Type');
                }
            },
            method_declaration(node: TreeSitterNode) {
                // Find method name
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkPascalCase(nameChild, context, 'Method');
                }
            },
            procedure_declaration(node: TreeSitterNode) {
                // Find procedure name
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkPascalCase(nameChild, context, 'Procedure');
                }
            },
            function_declaration(node: TreeSitterNode) {
                // Find function name
                const nameChild = node.childForFieldName('name');
                if (nameChild) {
                    checkPascalCase(nameChild, context, 'Function');
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
        });
    }
}

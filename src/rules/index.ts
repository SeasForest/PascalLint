import { LintRule } from '../types';
import { noWithRule } from './no-with';
import { emptyBeginEndRule } from './empty-begin-end';
import { noSemicolonBeforeElseRule } from './no-semicolon-before-else';
import { danglingSemicolonRule } from './dangling-semicolon';
import { useFreeAndNilRule } from './use-free-and-nil';
import { noEmptyFinallyRule } from './no-empty-finally';
import { pascalCaseRule } from './pascal-case';
import { oneVarPerLineRule } from './one-var-per-line';
import { unreachableCodeRule } from './unreachable-code';
import { camelCaseRule } from './camel-case';
import { upperCaseKeywordsRule } from './upper-case-keywords';
import { constructorCallOnInstanceRule } from './constructor-call-on-instance';
import { checkAssignedRule } from './check-assigned';
import { noExitInFinallyRule } from './no-exit-in-finally';

/**
 * All available lint rules (14 total)
 */
export const allRules: LintRule[] = [
    // Potential Errors
    noWithRule,
    noSemicolonBeforeElseRule,
    danglingSemicolonRule,
    noEmptyFinallyRule,
    unreachableCodeRule,
    constructorCallOnInstanceRule,
    noExitInFinallyRule,

    // Best Practices
    emptyBeginEndRule,
    useFreeAndNilRule,
    checkAssignedRule,

    // Stylistic Issues
    pascalCaseRule,
    oneVarPerLineRule,
    camelCaseRule,
    upperCaseKeywordsRule,
];

// Re-export all rules
export { noWithRule } from './no-with';
export { emptyBeginEndRule } from './empty-begin-end';
export { noSemicolonBeforeElseRule } from './no-semicolon-before-else';
export { danglingSemicolonRule } from './dangling-semicolon';
export { useFreeAndNilRule } from './use-free-and-nil';
export { noEmptyFinallyRule } from './no-empty-finally';
export { pascalCaseRule } from './pascal-case';
export { oneVarPerLineRule } from './one-var-per-line';
export { unreachableCodeRule } from './unreachable-code';
export { camelCaseRule } from './camel-case';
export { upperCaseKeywordsRule } from './upper-case-keywords';
export { constructorCallOnInstanceRule } from './constructor-call-on-instance';
export { checkAssignedRule } from './check-assigned';
export { noExitInFinallyRule } from './no-exit-in-finally';

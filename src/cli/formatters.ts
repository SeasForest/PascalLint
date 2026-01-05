import * as path from 'path';
import { LintIssue } from '../types';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
};

/**
 * Stylish format (default, similar to ESLint)
 */
export function formatStylish(
    issues: Map<string, LintIssue[]>,
    useColor: boolean = true
): string {
    const c = useColor ? colors : { reset: '', red: '', yellow: '', cyan: '', gray: '', bold: '' };
    const lines: string[] = [];

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const [file, fileIssues] of issues) {
        const relativePath = path.relative(process.cwd(), file);
        lines.push(`\n${c.bold}${relativePath}${c.reset}`);

        for (const issue of fileIssues) {
            const severity = issue.severity === 'error' ? 'error' : 'warning';
            const severityColor = severity === 'error' ? c.red : c.yellow;

            const line = issue.range.start.line + 1;
            const column = issue.range.start.column + 1;

            lines.push(
                `  ${c.gray}${line}:${column}${c.reset}  ` +
                `${severityColor}${severity}${c.reset}  ` +
                `${issue.message}  ` +
                `${c.gray}${issue.ruleId}${c.reset}`
            );

            if (severity === 'error') totalErrors++;
            else totalWarnings++;
        }
    }

    // Summary
    if (totalErrors > 0 || totalWarnings > 0) {
        const summaryColor = totalErrors > 0 ? c.red : c.yellow;
        lines.push(
            `\n${summaryColor}${c.bold}✖ ${totalErrors + totalWarnings} problem(s)${c.reset} ` +
            `(${totalErrors} error(s), ${totalWarnings} warning(s))\n`
        );
    } else {
        lines.push(`\n${c.cyan}✓ No problems found${c.reset}\n`);
    }

    return lines.join('\n');
}

/**
 * JSON format for programmatic use
 */
export function formatJson(issues: Map<string, LintIssue[]>): string {
    const result: object[] = [];

    for (const [file, fileIssues] of issues) {
        for (const issue of fileIssues) {
            result.push({
                filePath: file,
                ruleId: issue.ruleId,
                severity: issue.severity,
                message: issue.message,
                line: issue.range.start.line + 1,
                column: issue.range.start.column + 1,
                endLine: issue.range.end.line + 1,
                endColumn: issue.range.end.column + 1,
                fix: issue.fix ? {
                    text: issue.fix.text,
                    range: {
                        start: issue.fix.range.start.offset,
                        end: issue.fix.range.end.offset,
                    },
                } : null,
            });
        }
    }

    return JSON.stringify(result, null, 2);
}

/**
 * Unix format (one line per issue, easy to parse)
 */
export function formatUnix(issues: Map<string, LintIssue[]>): string {
    const lines: string[] = [];

    for (const [file, fileIssues] of issues) {
        for (const issue of fileIssues) {
            const line = issue.range.start.line + 1;
            const column = issue.range.start.column + 1;
            const severity = issue.severity === 'error' ? 'error' : 'warning';

            lines.push(`${file}:${line}:${column}: ${severity}: ${issue.message} [${issue.ruleId}]`);
        }
    }

    return lines.join('\n');
}

/**
 * SonarQube Generic Issue Format
 * https://docs.sonarqube.org/latest/analysis/generic-issue/
 */
export function formatSonar(issues: Map<string, LintIssue[]>): string {
    const result = {
        issues: [] as object[],
    };

    for (const [file, fileIssues] of issues) {
        for (const issue of fileIssues) {
            let severity: string;
            switch (issue.severity) {
                case 'error':
                    severity = 'MAJOR';
                    break;
                case 'warn':
                    severity = 'MINOR';
                    break;
                case 'info':
                    severity = 'INFO';
                    break;
                default:
                    severity = 'INFO';
            }

            result.issues.push({
                engineId: 'pascallint',
                ruleId: issue.ruleId,
                severity,
                type: 'CODE_SMELL',
                primaryLocation: {
                    message: issue.message,
                    filePath: file,
                    textRange: {
                        startLine: issue.range.start.line + 1,
                        startColumn: issue.range.start.column,
                        endLine: issue.range.end.line + 1,
                        endColumn: issue.range.end.column,
                    },
                },
            });
        }
    }

    return JSON.stringify(result, null, 2);
}

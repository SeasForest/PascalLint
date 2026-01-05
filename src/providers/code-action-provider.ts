import * as vscode from 'vscode';
import { LinterService } from '../linter/linter-service';
import { LintIssue } from '../types';

/**
 * Provides code actions (Quick Fixes) for PascalLint issues.
 * Optimized to use cached lint results instead of re-linting on every call (P1#7).
 */
export class CodeActionProvider implements vscode.CodeActionProvider {
    private linterService: LinterService;

    constructor(linterService: LinterService) {
        this.linterService = linterService;
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        _context: vscode.CodeActionContext
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        // P1#7 Performance fix: Use cached results if available, otherwise lint
        let issues = this.linterService.getCachedResults(document.fileName);
        if (!issues) {
            // Fallback to linting (this should rarely happen as lint runs on document change)
            issues = await this.linterService.lint(document.getText(), document.fileName);
        }

        // Find issues that overlap with the current range
        const relevantIssues = issues.filter(issue => this.issueOverlapsRange(issue, range));

        for (const issue of relevantIssues) {
            if (issue.fix) {
                const action = this.createQuickFix(document, issue);
                actions.push(action);
            }

            if (issue.suggestions) {
                for (const suggestion of issue.suggestions) {
                    const action = this.createSuggestionFix(document, issue, suggestion);
                    actions.push(action);
                }
            }
        }

        // Add "Fix All" action if there are multiple fixable issues in the document
        const allFixableIssues = issues.filter(issue => issue.fix);
        if (allFixableIssues.length > 1) {
            const fixAllAction = this.createFixAllAction(document, allFixableIssues);
            actions.push(fixAllAction);
        }

        return actions;
    }

    /**
     * Check if an issue overlaps with a range.
     */
    private issueOverlapsRange(issue: LintIssue, range: vscode.Range): boolean {
        const issueRange = new vscode.Range(
            issue.range.start.line,
            issue.range.start.column,
            issue.range.end.line,
            issue.range.end.column
        );
        return issueRange.intersection(range) !== undefined;
    }

    /**
     * Create a Quick Fix action for an issue.
     */
    private createQuickFix(document: vscode.TextDocument, issue: LintIssue): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Fix: ${issue.message}`,
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [this.issueToDiagnostic(issue, document.uri)];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();
        if (issue.fix) {
            const range = new vscode.Range(
                issue.fix.range.start.line,
                issue.fix.range.start.column,
                issue.fix.range.end.line,
                issue.fix.range.end.column
            );
            edit.replace(document.uri, range, issue.fix.text);
        }
        action.edit = edit;

        return action;
    }

    /**
     * Create a suggestion fix action.
     */
    private createSuggestionFix(
        document: vscode.TextDocument,
        _issue: LintIssue,
        suggestion: LintIssue['fix']
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Suggestion: Replace with "${suggestion?.text.substring(0, 30)}..."`,
            vscode.CodeActionKind.QuickFix
        );

        if (suggestion) {
            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(
                suggestion.range.start.line,
                suggestion.range.start.column,
                suggestion.range.end.line,
                suggestion.range.end.column
            );
            edit.replace(document.uri, range, suggestion.text);
            action.edit = edit;
        }

        return action;
    }

    /**
     * Create a "Fix All" action.
     */
    private createFixAllAction(
        document: vscode.TextDocument,
        issues: LintIssue[]
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Fix all ${issues.length} PascalLint issues`,
            vscode.CodeActionKind.SourceFixAll
        );

        const edit = new vscode.WorkspaceEdit();

        // Sort fixes by position (reversed to avoid offset issues)
        const sortedIssues = [...issues]
            .filter(issue => issue.fix)
            .sort((a, b) => (b.fix!.range.start.offset ?? 0) - (a.fix!.range.start.offset ?? 0));

        for (const issue of sortedIssues) {
            if (issue.fix) {
                const range = new vscode.Range(
                    issue.fix.range.start.line,
                    issue.fix.range.start.column,
                    issue.fix.range.end.line,
                    issue.fix.range.end.column
                );
                edit.replace(document.uri, range, issue.fix.text);
            }
        }

        action.edit = edit;
        return action;
    }

    /**
     * Convert LintIssue to vscode.Diagnostic.
     */
    private issueToDiagnostic(issue: LintIssue, _uri: vscode.Uri): vscode.Diagnostic {
        const range = new vscode.Range(
            issue.range.start.line,
            issue.range.start.column,
            issue.range.end.line,
            issue.range.end.column
        );

        const severity =
            issue.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : issue.severity === 'warn'
                    ? vscode.DiagnosticSeverity.Warning
                    : vscode.DiagnosticSeverity.Information;

        const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
        diagnostic.code = issue.ruleId;
        diagnostic.source = 'PascalLint';

        return diagnostic;
    }
}

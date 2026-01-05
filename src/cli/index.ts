#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { LinterService } from '../linter/linter-service';
import { initConfig } from '../config';
import { LintIssue } from '../types';
import { formatStylish, formatJson, formatUnix, formatSonar } from './formatters';

const program = new Command();

program
    .name('pslint')
    .description('PascalLint - Static analysis tool for Delphi/Object Pascal')
    .version('0.2.0');

program
    .argument('[files...]', 'Files or glob patterns to lint')
    .option('-f, --fix', 'Automatically fix problems')
    .option('--format <type>', 'Output format: stylish, json, unix, sonar', 'stylish')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--init', 'Initialize configuration file')
    .option('--no-color', 'Disable colored output')
    .option('-q, --quiet', 'Report errors only, no warnings')
    .option('--cache', 'Enable caching (not implemented yet)')
    .action(async (files: string[], options: CLIOptions) => {
        try {
            await run(files, options);
        } catch (error) {
            console.error(
                'Error:',
                error instanceof Error ? error.message : String(error)
            );
            process.exit(1);
        }
    });

program.parse();

interface CLIOptions {
    fix?: boolean;
    format: 'stylish' | 'json' | 'unix' | 'sonar';
    config?: string;
    init?: boolean;
    color?: boolean;
    quiet?: boolean;
    cache?: boolean;
}

async function run(files: string[], options: CLIOptions): Promise<void> {
    // Handle --init command
    if (options.init) {
        const targetPath = process.cwd();
        initConfig(targetPath);
        console.log('Created .PascalLint.json in', targetPath);
        return;
    }

    // Find files to lint
    const filesToLint = await findFiles(files);

    if (filesToLint.length === 0) {
        console.log('No Pascal files found.');
        return;
    }

    // Initialize linter
    const linterService = new LinterService();
    const extensionPath = path.dirname(__dirname);
    await linterService.initialize(extensionPath);

    // Collect all issues
    const allIssues: Map<string, LintIssue[]> = new Map();
    let totalIssues = 0;
    let totalFixed = 0;

    for (const file of filesToLint) {
        const absolutePath = path.resolve(file);
        const workspacePath = findWorkspaceRoot(absolutePath);
        const sourceCode = fs.readFileSync(absolutePath, 'utf8');

        let issues = await linterService.lint(sourceCode, absolutePath, workspacePath);

        // Filter warnings if quiet mode
        if (options.quiet) {
            issues = issues.filter(issue => issue.severity === 'error');
        }

        // Apply fixes if requested
        if (options.fix) {
            const { fixedCode, fixCount } = applyFixes(sourceCode, issues);
            if (fixCount > 0) {
                fs.writeFileSync(absolutePath, fixedCode, 'utf8');
                totalFixed += fixCount;
                // Re-lint after fixing
                issues = await linterService.lint(fixedCode, absolutePath, workspacePath);
            }
        }

        if (issues.length > 0) {
            allIssues.set(absolutePath, issues);
            totalIssues += issues.length;
        }
    }

    // Output results
    const output = formatOutput(allIssues, options.format, options.color !== false);
    console.log(output);

    // Summary
    if (options.fix && totalFixed > 0) {
        console.log(`\n✓ Fixed ${totalFixed} problem(s)`);
    }

    // Exit with error code if there are issues
    if (totalIssues > 0) {
        const errorCount = Array.from(allIssues.values())
            .flat()
            .filter(issue => issue.severity === 'error').length;
        if (errorCount > 0) {
            process.exit(1);
        }
    }

    // Cleanup
    linterService.cleanup();
}

/**
 * Find all Pascal files matching the given patterns.
 */
async function findFiles(patterns: string[]): Promise<string[]> {
    if (patterns.length === 0) {
        // Default: find all .pas files in current directory
        patterns = ['**/*.pas', '**/*.dpr', '**/*.dpk'];
    }

    const files: string[] = [];

    for (const pattern of patterns) {
        if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
            files.push(pattern);
        } else {
            const matches = await glob(pattern, {
                ignore: ['**/node_modules/**', '**/out/**', '**/__history/**'],
            });
            files.push(...matches);
        }
    }

    // Filter to only Pascal files
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.pas', '.dpr', '.dpk', '.pp', '.lpr'].includes(ext);
    });
}

/**
 * Find the workspace root for a file.
 */
function findWorkspaceRoot(filePath: string): string {
    let dir = path.dirname(filePath);

    while (dir !== path.dirname(dir)) {
        // Look for common project markers
        const markers = ['.PascalLint.json', '.dproj', '.groupproj', '.git'];
        for (const marker of markers) {
            if (fs.existsSync(path.join(dir, marker))) {
                return dir;
            }
        }
        dir = path.dirname(dir);
    }

    return path.dirname(filePath); // Fallback to file's directory
}

/**
 * Apply auto-fixes to source code.
 */
function applyFixes(
    sourceCode: string,
    issues: LintIssue[]
): { fixedCode: string; fixCount: number } {
    const fixableIssues = issues.filter(issue => issue.fix);

    if (fixableIssues.length === 0) {
        return { fixedCode: sourceCode, fixCount: 0 };
    }

    // Sort by position (reversed to avoid offset issues)
    const sortedIssues = [...fixableIssues].sort(
        (a, b) => (b.fix!.range.start.offset ?? 0) - (a.fix!.range.start.offset ?? 0)
    );

    let result = sourceCode;
    let fixCount = 0;

    for (const issue of sortedIssues) {
        if (issue.fix) {
            const start = issue.fix.range.start.offset ?? 0;
            const end = issue.fix.range.end.offset ?? start;
            result = result.substring(0, start) + issue.fix.text + result.substring(end);
            fixCount++;
        }
    }

    return { fixedCode: result, fixCount };
}

/**
 * Format output based on the selected format.
 */
function formatOutput(
    issues: Map<string, LintIssue[]>,
    format: string,
    useColor: boolean
): string {
    switch (format) {
        case 'json':
            return formatJson(issues);
        case 'unix':
            return formatUnix(issues);
        case 'sonar':
            return formatSonar(issues);
        case 'stylish':
        default:
            return formatStylish(issues, useColor);
    }
}

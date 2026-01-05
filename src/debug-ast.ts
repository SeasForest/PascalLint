/**
 * Debug script to inspect tree-sitter-pascal AST structure
 */

import * as path from 'path';
import * as fs from 'fs';
import Parser from 'web-tree-sitter';

async function main() {
    const testFile = process.argv[2] || 'test/fixtures/sample.pas';

    await Parser.init();
    const parser = new Parser();

    const wasmPath = path.join(__dirname, '..', 'parsers', 'tree-sitter-pascal.wasm');
    console.log('Loading WASM from:', wasmPath);

    const language = await Parser.Language.load(wasmPath);
    parser.setLanguage(language);

    const sourceCode = fs.readFileSync(testFile, 'utf8');
    console.log('\n--- Source Code ---\n');
    console.log(sourceCode);

    const tree = parser.parse(sourceCode);
    console.log('\n--- AST Structure ---\n');

    function printNode(node: Parser.SyntaxNode, indent: number = 0) {
        const prefix = '  '.repeat(indent);
        const text = node.text.length > 40 ? node.text.substring(0, 40) + '...' : node.text;
        console.log(`${prefix}${node.type} [${node.startPosition.row}:${node.startPosition.column}] "${text.replace(/\n/g, '\\n')}"`);

        for (const child of node.children) {
            printNode(child, indent + 1);
        }
    }

    printNode(tree.rootNode);

    // Collect all unique node types
    const nodeTypes = new Set<string>();
    function collectTypes(node: Parser.SyntaxNode) {
        nodeTypes.add(node.type);
        for (const child of node.children) {
            collectTypes(child);
        }
    }
    collectTypes(tree.rootNode);

    console.log('\n--- All Node Types ---\n');
    console.log([...nodeTypes].sort().join(', '));
}

main().catch(console.error);

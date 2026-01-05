const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');

async function main() {
    await Parser.init();
    const parser = new Parser();
    const wasmPath = path.join(__dirname, 'parsers', 'tree-sitter-pascal.wasm');
    const Lang = await Parser.Language.load(wasmPath);
    parser.setLanguage(Lang);

    const source = fs.readFileSync(path.join(__dirname, 'test', 'fixtures', 'sample.pas'), 'utf8');
    const tree = parser.parse(source);

    // Collect all node types
    const nodeTypes = new Set();
    function collectTypes(node) {
        nodeTypes.add(node.type);
        for (const child of node.children) {
            collectTypes(child);
        }
    }
    collectTypes(tree.rootNode);

    console.log('Unique Node Types:');
    console.log(Array.from(nodeTypes).sort().join('\n'));

    // Dump specific nodes for pascal-case
    console.log('\n--- Checking nodes for PascalCase ---');
    const cursor = tree.walk();
    // basic walk to find declarations
    function walk(node) {
        if (['declClass', 'declType', 'declProc'].includes(node.type)) {
            console.log(`${node.type}: ${node.text.split('\n')[0]}...`);
        }
        for (const child of node.children) walk(child);
    }
    walk(tree.rootNode);

}

function traverse(node, depth = 0) {
    const indent = ' '.repeat(depth * 2);
    let fields = '';
    // This is a hacky way to see fields, ideally we'd iterate over them if the API supported it easily
    // but tree.rootNode.toString() gives a good s-expression representation.

    // console.log(`${indent}${node.type} [${node.id}]`);

    // for (const child of node.children) {
    //     traverse(child, depth + 1);
    // }
}

main().catch(err => console.error(err));

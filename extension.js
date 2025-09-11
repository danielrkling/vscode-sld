const vscode = require('vscode');
const acorn = require('acorn');
const acornWalk = require('acorn-walk');
const html5parser = require('html5parser');


const EXPRESSION_MARKER = '###JS_EXPRESSION###';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const formatter = {
        provideDocumentFormattingEdits(document) {
            const allEdits = [];
            const text = document.getText();
            
            

            try {
                // Step 1: Parse the entire JS/TS document to get the AST
                const ast = acorn.parse(text, { ecmaVersion: 2020, sourceType:"module" });
                
                // Step 2: Find all `sld` tagged template expressions
                acornWalk.simple(ast, {
                    TaggedTemplateExpression(node) {
                        if (node.tag.type === 'Identifier' && node.tag.name === 'sld') {
                            const template = node.quasi;
                            const expressions = template.expressions.map(expr => {
                                return text.substring(expr.start, expr.end);
                            });

                            // Get the base indentation of the line containing the sld tag
                            const lineNumber = document.positionAt(node.start).line;
                            const line = document.lineAt(lineNumber);
                            const baseIndentation = line.firstNonWhitespaceCharacterIndex;

                            // Step 3: Join quasis with the expression marker
                            let markedHtml = template.quasis.map(q=>q.value.raw).join(EXPRESSION_MARKER)

                            // Step 4: Parse the marked HTML with html5parser
                            const htmlAst = html5parser.parse(markedHtml);
                            
                            // Step 5: Format the HTML AST and reconstruct with markers
                            const formattedHtmlWithMarkers = formatHtmlAst(htmlAst, EXPRESSION_MARKER, baseIndentation/2);

                            // Step 6: Replace markers with original expressions
                            let formattedHtml = formattedHtmlWithMarkers;
                            expressions.forEach(expr => {
                                formattedHtml = formattedHtml.replace(EXPRESSION_MARKER, `\${${expr}}`);
                            });
                            
                            const startPos = document.positionAt(template.start + 1);
                            const endPos = document.positionAt(template.end - 1);
                            const rangeToFormat = new vscode.Range(startPos, endPos);
                            
                            allEdits.push(vscode.TextEdit.replace(rangeToFormat, formattedHtml));
                        }
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to format: ${error.message}`);
                return [];
            }
            
            return allEdits;
        }
    };

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            'javascript',
            formatter
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            'typescript',
            formatter
        )
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};

/**
 * Recursively walks the HTML AST to format it.
 * @param {Array<import('html5parser').INode>} nodes - The nodes to format.
 * @param {string} marker - The expression marker.
 * @param {number} indentLevel - The current indentation level.
 * @returns {string} - The formatted HTML.
 */
function formatHtmlAst(nodes, marker, indentLevel = 0) {
    let formattedCode = '';
    const indent = ' '.repeat(2).repeat(indentLevel);
    
    nodes.forEach(node => {
        if (node.type === html5parser.SyntaxKind.Tag) {
            const attributeGap = node.attributes.length> 2 ? "\n"+ indent + "  " : " "
            const closingGap = node.attributes.length> 2 ? "\n"+ indent: " "
            // Format opening tag
            formattedCode += `\n${indent}<${node.rawName}`;                
            node.attributes?.forEach(attr => {
                if (attr.value) {
                    if (attr.value.value===EXPRESSION_MARKER){
                      formattedCode += `${attributeGap}${attr.name.value}=${attr.value.value}`;
                    }else{
                      formattedCode += `${attributeGap}${attr.name.value}="${attr.value.value}"`;
                    }                    
                } else {
                    formattedCode += `${attributeGap}${attr.name.value}`;
                }
            });
            
            if (node.body?.length){
              formattedCode += `${closingGap}>`;
              formattedCode += formatHtmlAst(node.body, marker, indentLevel + 1);
              formattedCode += `\n${indent}</${node.rawName}>`;
            }else{
              formattedCode += `${closingGap}/>`;

            }

        } else if (node.type === html5parser.SyntaxKind.Text) {
            // Trim and add text content
            const trimmedText = node.value.trim();
            if (trimmedText) {
                formattedCode += `\n${indent}${trimmedText}`;
            }
        }
    });

    return formattedCode;
}
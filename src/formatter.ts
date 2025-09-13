import * as vscode from "vscode";
import * as html5parser from "html5parser";
import * as ts from "typescript";

const markerSymbol = "⦿"; // Unique symbol to avoid collisions

export const formatter = {
  provideDocumentFormattingEdits(document: vscode.TextDocument) {
    const allEdits: vscode.TextEdit[] = [];
    const text = document.getText();

    const sourceFile = ts.createSourceFile(
      document.fileName,
      text,
      ts.ScriptTarget.ES2022,
      true
    );

    // Start the traversal from the root of the AST.

    function findTaggedTemplateLiterals(node: ts.Node) {
      if (ts.isTaggedTemplateExpression(node)) {
        // 'node.tag' is the expression that's used as the tag (e.g., 'highlight' or 'myTag').
        // 'node.template' is the template literal itself.
        const tag = node.tag.getText(sourceFile);
        let html = "";
        if (/sld/i.test(tag)) {
          if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
            html = formatHtmlAst(
              html5parser.parse(node.template.text),
              markerSymbol,
              document.lineAt(document.positionAt(node.template.getStart()).line).firstNonWhitespaceCharacterIndex/getTabSize() + 1
            );
          } else if (ts.isTemplateExpression(node.template)) {
            html = [
              node.template.head.text,
              ...node.template.templateSpans.map((span) => span.literal.text),
            ].join(markerSymbol);
            html = formatHtmlAst(
              html5parser.parse(html),
              markerSymbol,
              document.lineAt(document.positionAt(node.template.getStart()).line).firstNonWhitespaceCharacterIndex/getTabSize() + 1
            );
            const parts = html.split(markerSymbol);
            console.log(node);
            html = parts.slice(1).reduce((acc, part, index) => {
              return `${acc}\${${node.template.templateSpans[
                index
              ].expression.getText(sourceFile)}}${part}`;
            }, parts[0]);
          }

          allEdits.push(
            vscode.TextEdit.replace(
              new vscode.Range(
                document.positionAt(node.template.getStart() + 1),
                document.positionAt(node.template.getEnd() - 1)
              ),
              html
            )
          );
        }
      }
      // Recursively visit all children of the current node.
      ts.forEachChild(node, findTaggedTemplateLiterals);
    }

    try {
      findTaggedTemplateLiterals(sourceFile);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to format: ${error.message}`);
      return [];
    }

    return allEdits;
  },
};
/**
 * Recursively walks the HTML AST to format it.
 * @param {Array<import('html5parser').INode>} nodes - The nodes to format.
 * @param {string} marker - The expression marker.
 * @param {number} indentLevel - The current indentation level.
 * @returns {string} - The formatted HTML.
 */
function formatHtmlAst(nodes, marker, indentLevel = 0) {
  let formattedCode = "";
  const tabSize = getTabSize();
  const indent = " ".repeat(tabSize).repeat(indentLevel);

  nodes.forEach((node: html5parser.INode) => {
    if (node.type === html5parser.SyntaxKind.Tag) {
      const attributeGap =
        node.attributes.length > 2 ? "\n" + indent + " ".repeat(tabSize) : " ";
      const closingGap = node.attributes.length > 2 ? "\n" + indent : "";
      // Format opening tag
      formattedCode += `\n${indent}<${node.rawName}`;
      node.attributes?.forEach((attr) => {
        if (attr.value) {
          if (attr.value.value === markerSymbol) {
            formattedCode += `${attributeGap}${attr.name.value}=${attr.value.value}`;
          } else {
            formattedCode += `${attributeGap}${attr.name.value}="${attr.value.value}"`;
          }
        } else {
          formattedCode += `${attributeGap}${attr.name.value}`;
        }
      });
      if (node.name.startsWith("!--")) {
        formattedCode += `${node.body[0].value} -->`;
      } else      if (node.body?.length) {
        formattedCode += `${closingGap}>`;
        formattedCode += formatHtmlAst(node.body, marker, indentLevel + 1);
        formattedCode += `\n${indent}</${node.rawName}>`;
      } else {
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

function getNodeIndentation(node: ts.Node, sourceFile: ts.SourceFile): number {
  // Get the character position of the start of the node.
  const startPosition = node.getStart(sourceFile);

  // Get the line and character details for this position.
  const { line, character } =
    sourceFile.getLineAndCharacterOfPosition(startPosition);

  // Get the position of the start of the line.
  const lineStart = sourceFile.l

  // The indentation is the difference between the node's start position and the line's start position.
  return 
}

function getTabSize(): number {
  const editor = vscode.window.activeTextEditor;

  return editor?.options.indentSize ?? 4

}

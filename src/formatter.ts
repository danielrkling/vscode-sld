import * as vscode from "vscode";
import * as html5parser from "html5parser";
import ts from "typescript";

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
        const template = node.template;
        let html = "";
        if (/sld/i.test(tag)) {
          const indentLevel =
            document.lineAt(document.positionAt(template.getStart()).line)
              .firstNonWhitespaceCharacterIndex /
            (vscode.window.activeTextEditor?.options.indentSize as number);
          if (ts.isNoSubstitutionTemplateLiteral(template)) {
            html = formatNodes(html5parser.parse(template.text), indentLevel);
          } else if (ts.isTemplateExpression(template)) {
            html = [
              template.head.text,
              ...template.templateSpans.map((span) => span.literal.text),
            ].join(markerSymbol);
            html = formatNodes(html5parser.parse(html), indentLevel);
            const parts = html.split(markerSymbol);
            html = parts.slice(1).reduce((acc, part, index) => {
              return `${acc}\${${template.templateSpans[
                index
              ].expression.getText(sourceFile)}}${part}`;
            }, parts[0]);
          }

          allEdits.push(
            vscode.TextEdit.replace(
              new vscode.Range(
                document.positionAt(template.getStart() + 1),
                document.positionAt(template.getEnd() - 1)
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

function formatNodes(nodes: html5parser.INode[], level: number) {
  return nodes.map((node) => formatNode(node, level + 1)).join("");
}

function wrap(value: string,level:number){
    return "\n"+ getIndent(level+1) + value+ "\n"+ getIndent(level)
}

function formatNode(node: html5parser.INode, level: number) {
  if (node.type === html5parser.SyntaxKind.Text) {
    return formatTextNode(node, level);
  } else {
    if (node.name.startsWith("!") || node.name === "") {
      return "\n"+ getIndent(level) + formatCommentNode(node);
    } else {
      return getIndent(level) + formatTagNode(node, level);
    }
  }
}

function formatTagNode(node: html5parser.ITag, level: number) {
  if (node.body?.length) {
    return `<${node.rawName}${formatAttributes(
      node.attributes ?? [],
      level
    )}>${wrap(formatNodes(node.body, level),level)}</${node.rawName}>`;
  } else {
    return `<${node.rawName}${formatAttributes(
      node.attributes ?? [],
      level
    )}/>`;
  }
}

function formatTextNode(node: html5parser.IText, level: number) {
    const value = node.value.trim();
    if (value.length<20){
        return value
    }
    return "\n"+getIndent(level) + value
}

function formatAttributes(attributes: html5parser.IAttribute[], level: number) {
  if (attributes.length > 2) {
    return `\n${getIndent(level + 1)}${attributes
      .map(formatAttribute)
      .join(`\n${getIndent(level + 1)}`)}\n${getIndent(level)}`;
  } else {
    return attributes.map(formatAttribute).join(" ");
  }
}

function formatAttribute(attribute: html5parser.IAttribute) {
  const value = attribute.value?.value;
  if (value) {
    if (value === markerSymbol) {
      return `${attribute.name.value}=${value}`;
    } else {
      return `${attribute.name.value}="${value}"`;
    }
  } else {
    return attribute.name.value;
  }
}



function formatCommentNode(node: html5parser.ITag) {
  const comment = node.body
    ?.filter((v) => v.type === html5parser.SyntaxKind.Text)
    .map((v) => v.value)
    .join("");
  return `<!--${comment}-->`;
}

function getIndent(level: number) {
  return " "
    .repeat(vscode.window.activeTextEditor?.options.indentSize as number)
    .repeat(level);
}

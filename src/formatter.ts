

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
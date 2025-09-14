import * as ts from 'typescript';

export default function init(modules: { typescript: typeof ts }) {
    const ts = modules.typescript;

    // This is the main plugin function that returns the modified LanguageService.
    function create(info: ts.server.PluginCreateInfo) {
        const proxy = Object.create(null) as ts.LanguageService;
        for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
            const x = info.languageService[k];
            // @ts-ignore
            proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
        }

        // Intercept the getSemanticDiagnostics method.
        proxy.getSemanticDiagnostics = (fileName: string) => {
            const diagnostics = info.languageService.getSemanticDiagnostics(fileName);
            const sourceFile = info.languageService.getProgram()!.getSourceFile(fileName);

            if (sourceFile) {
                // Find all tagged template literals named "sld".
                ts.forEachChild(sourceFile, function visit(node) {
                    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && node.tag.text === 'sld') {
                        // Get the text of the template literal.
                        const templateText = node.template.getText(sourceFile);
                        const content = templateText.slice(1, -1); // Remove backticks.

                        if (content.trim().length === 0) {
                            // If the content is empty or only whitespace, add a diagnostic error.
                            diagnostics.push({
                                file: sourceFile,
                                start: node.template.getStart(sourceFile),
                                length: node.template.getWidth(sourceFile),
                                messageText: 'The "sld" tagged template must not be empty.',
                                category: ts.DiagnosticCategory.Error,
                                code: 9999
                            });
                        }
                    }
                    ts.forEachChild(node, visit);
                });
            }

            return diagnostics;
        };

        return proxy;
    }

    return { create };
}

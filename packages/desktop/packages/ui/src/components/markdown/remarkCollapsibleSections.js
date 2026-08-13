/**
 * Remark plugin that wraps heading + content groups into section nodes.
 *
 * For each heading (H1-H6), it collects all content until the next
 * same-or-higher level heading and wraps them in a section node.
 *
 * Example:
 *   ## Intro       -> section[depth=2]
 *     paragraph       contains: heading, paragraph, paragraph, section[depth=3]
 *     paragraph
 *     ### Details  -> section[depth=3] (nested inside Intro section)
 *       paragraph     contains: heading, paragraph
 *   ## Next       -> section[depth=2]
 */
import { visit } from 'unist-util-visit';
// Module-level counter reset for each parse
let sectionCounter = 0;
/**
 * remarkCollapsibleSections
 *
 * Transforms the markdown AST to wrap heading+content groups into
 * section nodes that can be rendered as collapsible sections.
 */
const remarkCollapsibleSections = () => {
    return (tree) => {
        // Reset counter for each document
        sectionCounter = 0;
        // Process from deepest to shallowest (6 -> 1)
        // This ensures nested sections are created before their parents
        for (let depth = 6; depth >= 1; depth--) {
            wrapHeadingsAtDepth(tree, depth);
        }
    };
};
function wrapHeadingsAtDepth(tree, depth) {
    // We need to iterate manually because we're modifying the tree
    const processNode = (parent) => {
        let i = 0;
        while (i < parent.children.length) {
            const node = parent.children[i];
            if (!node) {
                i++;
                continue;
            }
            // Recursively process existing sections (for nested content)
            // Note: 'section' is our custom node type, not in mdast types
            if (node.type === 'section') {
                processNode(node);
                i++;
                continue;
            }
            // Found a heading at our target depth
            if (node.type === 'heading' && node.depth === depth) {
                const sectionId = `section-${++sectionCounter}`;
                // Find where this section ends (next same-or-higher level heading)
                let endIndex = i + 1;
                while (endIndex < parent.children.length) {
                    const sibling = parent.children[endIndex];
                    if (!sibling)
                        break;
                    // Stop at another heading of same or higher level (lower number)
                    if (sibling.type === 'heading' && sibling.depth <= depth) {
                        break;
                    }
                    // Stop at a section that contains a same-or-higher level heading
                    // (already processed deeper sections)
                    // Note: 'section' is our custom node type, not in mdast types
                    if (sibling.type === 'section' && sibling.depth <= depth) {
                        break;
                    }
                    endIndex++;
                }
                // Extract nodes for this section
                const sectionChildren = parent.children.slice(i, endIndex);
                // Create section wrapper
                const section = {
                    type: 'section',
                    depth,
                    children: sectionChildren,
                    data: {
                        hName: 'div',
                        hProperties: {
                            'data-section-id': sectionId,
                            'data-heading-level': depth,
                            className: 'markdown-section',
                        },
                    },
                };
                // Replace the heading and its content with the section
                parent.children.splice(i, sectionChildren.length, section);
            }
            i++;
        }
    };
    processNode(tree);
}
export default remarkCollapsibleSections;
//# sourceMappingURL=remarkCollapsibleSections.js.map
import os
import re

def resolve_package_json(content):
    # Simple conflict resolver for package.json
    # Resolve version to 0.15.6
    content = re.sub(r'<<<<<<< HEAD\s+"version": "[^"]+",\s+\|\|\|\|\|\|\| [^\n]+\s+"version": "[^"]+",\s+=======\s+"version": "([^"]+)",\s+>>>>>>> origin/main', r'  "version": "\1",', content)
    
    # Resolve sandboxImageUri to 0.15.6
    content = re.sub(r'<<<<<<< HEAD\s+"sandboxImageUri": "[^"]+"\s+\|\|\|\|\|\|\| [^\n]+\s+"sandboxImageUri": "[^"]+"\s+=======\s+"sandboxImageUri": "([^"]+)"\s+>>>>>>> origin/main', r'    "sandboxImageUri": "\1"', content)
    
    # For other conflicts, if they contain @opentelemetry, remove them (or rather, keep the side that DOESN'T have them)
    # This is a bit more complex. Let's just handle version and sandboxImageUri for now and see what's left.
    return content

files = [
    "package.json",
    "packages/channels/base/package.json",
    "packages/channels/dingtalk/package.json",
    "packages/channels/plugin-example/package.json",
    "packages/channels/telegram/package.json",
    "packages/channels/weixin/package.json",
    "packages/cli/package.json",
    "packages/core/package.json",
    "packages/vscode-ide-companion/package.json",
    "packages/web-templates/package.json",
    "packages/webui/package.json"
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r') as fd:
            content = fd.read()
        resolved = resolve_package_json(content)
        # If there are still conflict markers, we might need manual intervention or better regex
        if "<<<<<<<" in resolved:
            # Try to just pick origin/main for version if it's still there
            resolved = re.sub(r'<<<<<<< HEAD\s+"version": "[^"]+",\s+=======\s+"version": "([^"]+)",\s+>>>>>>> origin/main', r'  "version": "\1",', resolved)
        
        with open(f, 'w') as fd:
            fd.write(resolved)


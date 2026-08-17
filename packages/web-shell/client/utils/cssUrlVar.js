export function cssUrlValue(url) {
  const escaped = url.replace(/["\\\n\r\f]/g, (char) => {
    switch (char) {
      case '"':
      case '\\':
        return `\\${char}`;
      case '\n':
        return '\\A ';
      case '\r':
        return '\\D ';
      case '\f':
        return '\\C ';
      default:
        return '';
    }
  });
  return `url("${escaped}")`;
}
export function cssUrlVar(name, url) {
  return { [name]: cssUrlValue(url) };
}
//# sourceMappingURL=cssUrlVar.js.map

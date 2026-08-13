import styles from './DialogPrimitives.module.css';
export function dp(...names) {
    return names
        .filter((name) => Boolean(name))
        .map((name) => styles[name])
        .filter(Boolean)
        .join(' ');
}
//# sourceMappingURL=dialogStyles.js.map
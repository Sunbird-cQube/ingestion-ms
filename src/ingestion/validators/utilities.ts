export function containsNonEmptyValues(arr) {
    return arr.some(item => item !== null || item !== undefined || item !== '');
}

export function containsEmptyValues(arr) {
    return arr.some(item => item === null || item === undefined || item === '');
}

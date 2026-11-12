// Escapa texto del usuario para usarlo de forma segura dentro de un RegExp.
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

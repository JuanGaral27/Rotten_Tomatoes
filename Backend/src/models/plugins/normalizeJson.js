/**
 * Plugin compartido por todos los esquemas: al serializar a JSON
 * expone `id` (en vez de `_id`), oculta `__v` y nunca filtra `password`.
 */
export const normalizeJson = (schema) => {
  schema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
      if (ret._id !== undefined) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      delete ret.password;
      return ret;
    },
  });
};

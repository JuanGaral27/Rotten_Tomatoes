export const buildPagination = ({ total, page, limit }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Consulta paginada reutilizable para cualquier modelo de Mongoose.
 * Devuelve { items, pagination } listo para enviarse con sendOk(res, items, { pagination }).
 */
export const paginate = async ({ model, filter = {}, sort, page, limit, populate, select }) => {
  let query = model
    .find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query, model.countDocuments(filter)]);
  return { items, pagination: buildPagination({ total, page, limit }) };
};

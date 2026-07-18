export function applyFieldErrors(error, setError) {
  const data = error?.response?.data;
  if (!data) return false;

  if (Array.isArray(data.errors)) {
    data.errors.forEach((err) => {
      if (err.field) {
        setError(err.field, { type: 'server', message: err.message ?? err.defaultMessage });
      }
    });
    return true;
  }

  if (data.message) {
    setError('root', { type: 'server', message: data.message });
    return true;
  }

  return false;
}

export const parseDateLocal = (dateStr: string) => {
    if (!dateStr) return new Date();
    // Handle YYYY-MM-DD without timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

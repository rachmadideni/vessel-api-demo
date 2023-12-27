export const convertMonthToName = (monthInt) => {
  const monthName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return monthName[monthInt - 1];
};

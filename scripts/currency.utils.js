export const convertRialToTomanWithSeperator = (rial) =>
  (rial / 10).toLocaleString();

console.log(convertRialToTomanWithSeperator(1000000000, { seperator: false }));

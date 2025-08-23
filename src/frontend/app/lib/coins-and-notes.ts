export const getCoinsAndNotes = (text: string) => {
  return text
    .split(",")
    .map(Number)
    .filter((number) => !isNaN(number));
};

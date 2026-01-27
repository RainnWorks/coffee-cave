export const getCoinsAndNotes = (text: string) => {
  return text
    .split(",")
    .map(Number)
    .filter((number) => !Number.isNaN(number));
};

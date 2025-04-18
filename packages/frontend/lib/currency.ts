export const createCurrencyFormatter = ({
  currencyLocale,
  currencyCode,
}: {
  currencyLocale: string;
  currencyCode: string;
}) => {
  // Detect how many fraction digits this currency uses
  const parts = new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: currencyCode,
  }).formatToParts(1);

  const fractionPart = parts.find((part) => part.type === "fraction");
  const fractionDigits = fractionPart ? fractionPart.value.length : 0;

  // Prepare the formatter using correct fraction digits
  const formatter = new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  // Return a function that accepts an amount in base units
  return (amountInBaseUnits: number): string => {
    const majorAmount = amountInBaseUnits / Math.pow(10, fractionDigits);
    return formatter.format(majorAmount);
  };
};

export const currencyUtils = ({
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

  return {
    fractionDigits,
    minorToMajor: (amountInBaseUnits: number): number => {
      return amountInBaseUnits / 10 ** fractionDigits;
    },
    majorToMinor: (amount: number): number => {
      return Math.round(amount * 10 ** fractionDigits);
    },
  };
};

export const createCurrencyFormatter = ({
  currencyLocale,
  currencyCode,
  options,
}: {
  currencyLocale: string;
  currencyCode: string;
  options?: Intl.NumberFormatOptions;
}) => {
  const { minorToMajor, fractionDigits } = currencyUtils({
    currencyLocale,
    currencyCode,
  });
  // Prepare the formatter using correct fraction digits
  const formatter = new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    ...options,
  });

  // Return a function that accepts an amount in base units
  return (amountInBaseUnits: number): string =>
    formatter.format(minorToMajor(amountInBaseUnits));
};

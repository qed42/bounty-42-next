export const getUsername = async (mail: string) => {
  const [namePart] = mail.split("@"); // "firstName.lastName"
  const [firstName, lastName] = namePart.split(".");

  const toTitleCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return `${toTitleCase(firstName)} ${toTitleCase(lastName)}`;
};

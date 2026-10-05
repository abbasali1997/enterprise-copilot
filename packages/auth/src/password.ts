import bcrypt from "bcrypt";

export const hashPassword = (password: string, saltRounds = 8) => {
  return bcrypt.hashSync(password, saltRounds);
};

export const verifyPassword = (password: string, passwordHash: string) => {
  return bcrypt.compareSync(password, passwordHash);
};

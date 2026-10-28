declare module "bcryptjs" {
  const bcrypt: {
    hash(data: string, saltOrRounds: number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };
  export default bcrypt;
}

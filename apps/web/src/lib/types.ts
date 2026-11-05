export type FormAction =
  | string
  | ((formData: FormData) => void | Promise<void>)
  | undefined;

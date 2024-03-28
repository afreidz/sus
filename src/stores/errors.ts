import { atom } from "nanostores";
const errors = atom<Error[]>([]);

export function ErrorHandler(err: Error) {
  const appErrors = errors.get();
  const newErrors = [...appErrors, err];
  errors.set(newErrors);
}

export function DismissError(idx: number) {
  const appErrors = errors.get();
  const newErrors = [...appErrors];
  newErrors.splice(idx, 1);
  errors.set(newErrors);
}

export default errors;

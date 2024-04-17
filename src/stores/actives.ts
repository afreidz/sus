import { map } from "nanostores";

const activeRevisionsBySystem = map<{ [key: string]: string }>({});

export { activeRevisionsBySystem };

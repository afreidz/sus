import { map } from "nanostores";

const activeRevisionsBySystem = map<Record<string, string>>({});

export { activeRevisionsBySystem };

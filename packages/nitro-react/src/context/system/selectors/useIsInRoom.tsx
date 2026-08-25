import { useSystemContext } from "../useSystemContext";

export const useIsInRoom = () => useSystemContext(x => x.isInRoom);

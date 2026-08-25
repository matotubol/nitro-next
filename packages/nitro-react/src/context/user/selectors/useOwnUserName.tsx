import { useUserContext } from '../useUserContext';

export const useOwnUserName = () => useUserContext(state => state.name);

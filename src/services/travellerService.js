import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const travellerService = {
  signUp: (profile) => http.post(API_ENDPOINTS.TRAVELLERS, profile),
  list: () => http.get(API_ENDPOINTS.TRAVELLERS),
  get: (travellerId) => http.get(API_ENDPOINTS.TRAVELLER(travellerId)),
  me: () => http.get(API_ENDPOINTS.ME),
};

import { metaService } from "../services/metaService";
import { toOptions } from "../lib/format";
import { useResource } from "./useResource";

async function loadMeta() {
  const meta = await metaService.get();
  return {
    ...meta,
    cityOptions: meta.cities.map((city) => ({ id: city.name, label: `${city.name}, ${city.country}` })),
    homeCityOptions: meta.homeCities.map((home) => ({ id: home.city, label: `${home.city} (${home.airport})` })),
    genderOptions: toOptions(meta.genders, "gender"),
    genderPreferenceOptions: toOptions(meta.genderPreferences, "genderPreference"),
    genderMixOptions: toOptions(meta.genderMixes, "genderMix"),
    hotelSortOptions: toOptions(meta.hotelSorts, "hotelSort"),
  };
}

export const useMeta = () => useResource(loadMeta, "meta");

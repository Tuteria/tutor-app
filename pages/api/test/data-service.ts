import { defaultView } from "../../../middlewares";
import {
  getSupportedCountries,
  getEducationData,
} from "@tuteria/tuteria-data/src";

export default defaultView(
  async (req) => {
    const data = await getEducationData();
    return data;
  },
  { method: "GET" }
);

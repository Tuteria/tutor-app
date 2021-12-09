import { getPricingInformation } from "@tuteria/tuteria-data/src";
import { defaultView } from "../../middlewares";



async function calculateHourlyPrice({ state, subject, vicinity }: {
  state: string;
  subject: string;
  vicinity: string;
}) {
  const { stateFactor, subjectFactor, vicinityFactor } = await getPricingInformation();
  const { rate: baseRate } = subjectFactor.find(factor => factor.subject === subject);
  const { rate: stateRate } = stateFactor.find(factor => factor.state === state);
  const { rate: vicinityRate = '80.0%' } = vicinityFactor.find(factor => factor.vicinity === vicinity) || {};

  const statePercentage = Number(stateRate.replace('%', '')) / 100;
  const vincinityPercentage = Number(vicinityRate.replace('%', '')) / 100;

  return baseRate * statePercentage * vincinityPercentage;
}


export default defaultView(
  async (req) => {
    const hourlyPrice = await calculateHourlyPrice(req.query as any);
    return { hourlyPrice };
  },
  { method: "GET" }
) 